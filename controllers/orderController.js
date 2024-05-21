const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Wallet = require("../models/walletModel");
require("dotenv").config();
const crypto = require("crypto");

const Razorpay = require("razorpay");
const { RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_KEY,
});

// Add order.
const addOrder = async (req, res) => {
  try {
    const {
      user,
      orderId,
      products,
      orderStatus,
      billTotal,
      address,
      paymentMethod,
      paymentStatus,
      createdOn,
      showDate,
    } = req.body;

    const newOrder = new Order({
      user,
      orderId,
      products,
      orderStatus,
      billTotal,
      address,
      paymentMethod,
      paymentStatus,
      createdOn,
      showDate,
    });

    const id = req.user || req.session.userData;

    const cart = await Cart.find({ userID: id });
    cart.forEach(async (prod) => {
      for (let i = 0; i < prod.products.length; i++) {
        let product = await Products.findById(prod.products[i].productID);
        product.stock = product.stock - prod.products[i].quantity;
        await product.save();
      }
    });

    if (newOrder.paymentMethod === "wallet") {
      let wallet = await Wallet.findOne({ userId: id });

      if (!wallet) {
        return res.status(400).json({
          message:
            "Not enough balance in wallet. Please choose another payment method.",
        });
      }

      if (wallet.walletBalance < newOrder.billTotal) {
        return res.status(400).json({
          message:
            "Not enough balance in wallet. Please choose another payment method.",
        });
      }

      const transaction = {
        transactionType: "Debit",
        amount: newOrder.billTotal,
        description: `The ${newOrder.orderId} was placed and ${newOrder.billTotal} was debited from your wallet`,
        orderId: newOrder.orderId,
      };

      wallet.walletBalance -= newOrder.billTotal;
      wallet.transactions.push(transaction);

      await wallet.save();

      await Cart.deleteOne({ userID: id });
      const savedOrder = await newOrder.save();
      return res.status(201).json(savedOrder);
    } 
    else if (newOrder.paymentMethod === "razorpay") {
      let options = {
        amount: parseFloat(newOrder.billTotal) * 100,
        currency: "INR",
        receipt: newOrder.orderId,
      };
      razorpayInstance.orders.create(options, function (err, order) {
        if (!err) {
          res.status(200).json({
            success: true,
            msg: "Order Created",
            order_id: order.id,
            amount: newOrder.billTotal * 100,
            key_id: RAZORPAY_KEY_ID,
            product_name: "product",
            description: "req.body.description",
            contact: "8848746391",
            name: "Abin Anto",
            email: "abinanto1998@gmail.com",
            newOrder,
          });
        } else {
          console.log(`Error buying the item using razor pay : ${err}`);
        }
      });
    } else {
      await Cart.deleteOne({ userID: id });
      const savedOrder = await newOrder.save();
      return res.status(201).json(savedOrder);
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Razor Pay add Order
const razorpayAddOrder = async (req, res) => {
  try {
    const id = req.user?.id || req.session.userData;

    const cart = await Cart.findOne({ userID: id }).populate(
      "products.productID"
    );
    if (!cart) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let cartProducts = [];
    for (const prod of cart.products) {
      let product = await Products.findById(prod.productID);
      product.stock = product.stock - prod.quantity;
      product.quantity = prod.quantity;
      cartProducts.push(product);
      await product.save();
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const { addressIndex, totalAmount, paymentMethod, status } = req.query;
    const selectedAddress = user.address[addressIndex];

    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ord${randomNumber}`;

    const myDate = new Date();
    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const formattedDate = formatter.format(myDate);

    const newOrder = new Order({
      orderId,
      user: id,
      products: cartProducts.map((product) => ({
        productId: product._id,
        productName: product.name,
        media: product.media[0],
        price: product.price,
        quantity: product.quantity,
        total: product.price * product.quantity,
        subtotal: product.price * product.quantity,
      })),
      orderStatus: "pending",
      billTotal: totalAmount,
      address: {
        addressType: selectedAddress.addressType,
        houseName: selectedAddress.houseName,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        country: selectedAddress.country,
        pincode: selectedAddress.pincode,
        phoneNumber: selectedAddress.phoneNumber,
      },
      paymentMethod,
      paymentStatus: status,
      createdOn: Date.now(),
      showDate: formattedDate,
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ userID: id });
    res
      .status(201)
      .json({
        success: true,
        message: "Order placed successfully",
        paymentStatus: status,
      });
  } catch (error) {
    console.log(
      `Error placing order using razor pay after going through /place order : ${error}`
    );
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

// Load Order Management.
const loadOrderManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skipIndex = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()
      .populate("user")
      .skip(skipIndex)
      .limit(limit);

    res.render("order_management", {
      orders,
      currentPage: page,
      limit,
      totalOrders,
    });
  } catch (error) {
    console.log(`error loading order management : ${error}`);
  }
};

// View individual orders
const loadSingleOrder = async (req, res) => {
  try {
    const { id } = req.query;
    const user = await User.findById(req.session.userData);
    const products = await Products.find({ isUnlisted: false });
    const categories = await Category.find({ isUnlisted: false });
    const orders = await Order.find({ _id: id }).sort({ createdOn: -1 });

    let google;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));

    res.render("single_order", {
      categories: categories,
      products: products,
      user: user,
      google,
      logout,
      orders,
    });
  } catch (error) {
    console.log(`error loading the single order : ${error}`);
  }
};

// Cancel a Product
const cancelProduct = async (req, res) => {
  console.log(`canceling the product from the order...`);
  const { orderId, productId } = req.params;
  const { cancelReason } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const product = order.products.find(
      (p) => p.productId.toString() === productId
    );
    if (!product) {
      return res.status(404).json({ error: "Product not found in order" });
    }

    const existingProduct = await Products.findById(productId);
    existingProduct.stock += product.quantity;
    existingProduct.save();

    let firstBill = order.billTotal;

    order.orderStatus = "partially-cancelled";
    order.billTotal -= product.price * product.quantity;
    product.cancelProduct = true;
    product.cancelReason = cancelReason;

    const allProductsCanceled = order.products.every((p) => p.cancelProduct);

    if (allProductsCanceled) {
      order.cancelAll = true;
      order.orderStatus = "cancelled";
      order.cancelReason = cancelReason;
    }

    const userId = req.session.userData || req.user?.id;

    console.log(`payment status : ${order.paymentStatus}`);

    if (order.paymentMethod != "cod" && order.paymentStatus == "Success") {
      console.log(`refunding the user...`);
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        console.log(
          `no wallet found for the user, creating new wallet for the user..`
        );
        wallet = new Wallet({ userId: userId, transactions: [] });
      }
      console.log(`user wallet : ${wallet}`);

      wallet.walletBalance += firstBill - order.billTotal;

      const transaction = {
        transactionType: "Credit",
        amount: order.billTotal,
        description: `The product ${existingProduct.name} was cancelled of the order ${order.orderId} and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.transactions.push(transaction);
      console.log(`user wallet after entering the transaction : ${wallet}`);

      wallet.save();
    }

    await order.save();

    res.status(200).json({
      message: "Order product canceled successfully",
      allProductsCanceled,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Cancel a Order
const cancelOrder = async (req, res) => {
  try {
    const id = req.query.id;
    const { cancelReason } = req.body;
    const order = await Order.findById(id);
    // console.log(`orders : ${order}`);

    const firstBill = order.billTotal;

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    order.products.forEach(async function (product) {
      const existingProduct = await Products.findById(product.productId);
      existingProduct.stock += product.quantity;
      // console.log(`existing product : ${existingProduct}`);
      await existingProduct.save();
    });

    order.cancelAll = true;
    order.cancelReason = cancelReason;
    order.orderStatus = "cancelled";
    order.products.forEach((product) => {
      product.cancelProduct = true;
    });

    if (order.paymentMethod != "cod" && order.paymentStatus == "Success") {
      const userId = req.session.userData;
      // console.log(`refunding the user...`);
      // const existingProduct = await Products.findById(productId);
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        // console.log(
        //   `no wallet found for the user, creating new wallet for the user..`
        // );
        wallet = new Wallet({ userId: userId, transactions: [] });
      }
      // console.log(`user wallet : ${wallet}`);

      const transaction = {
        transactionType: "Credit",
        amount: firstBill,
        description: `The order ${order.orderId} was canceled and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.walletBalance += firstBill;
      wallet.transactions.push(transaction);
      // console.log(`user wallet after entering the transaction : ${wallet}`);

      wallet.save();
    }

    await order.save();
    res.status(200).json({
      message: "Order product canceled successfully",
    });
  } catch (error) {
    console.log(`error cancelling order : ${error}`);
  }
};

// Return Single Order Page
const loadReturnSingleOrder = async (req, res) => {
  try {
    const { id } = req.query;
    const user = await User.findById(req.session.userData);
    const products = await Products.find({ isUnlisted: false });
    const categories = await Category.find({ isUnlisted: false });
    const orders = await Order.find({ _id: id }).sort({ createdOn: -1 });

    let google;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));

    res.render("return_order", {
      categories: categories,
      products: products,
      user: user,
      google,
      logout,
      orders,
    });
  } catch (error) {
    console.log(`error loading the single order : ${error}`);
  }
};

// Return a Product
const returnProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.query;
    const { returnReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const product = order.products.find(
      (p) => p.productId.toString() === productId
    );
    if (!product) {
      return res.status(404).json({ error: "Product not found in order" });
    }

    const firstBill = order.billTotal;

    // Update the product within the order
    product.returnProduct = true;
    product.returnReason = returnReason;
    // console.log("product : ", product);
    order.orderStatus = "partially-returned";
    order.billTotal -= product.price * product.quantity;

    // Check if all products in the order are returned
    const allProductsReturned = order.products.every((p) => p.returnProduct);

    // Update order status if necessary
    if (allProductsReturned) {
      order.orderStatus = "returned";
      order.returnAll = true;
    }

    const userId = req.session.userData || req.user?.id;

    if (order.paymentMethod != "cod") {
      // console.log(`refunding the user...`);
      const existingProduct = await Products.findById(productId);
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        // console.log(
        //   `no wallet found for the user, creating new wallet for the user..`
        // );
        wallet = new Wallet({ userId: userId, transactions: [] });
      }
      // console.log(`user wallet : ${wallet}`);

      const transaction = {
        transactionType: "Credit",
        amount: firstBill - order.billTotal,
        description: `The product ${existingProduct.name} was returned of the order ${order.orderId} and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.walletBalance += firstBill - order.billTotal;
      wallet.transactions.push(transaction);
      // console.log(`user wallet after entering the transaction : ${wallet}`);

      wallet.save();
    }

    // Save changes to the product and order
    await order.save();

    res
      .status(200)
      .json({ message: "Product returned successfully", allProductsReturned });
  } catch (error) {
    console.log(`Error returning a product: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Retrun a Order
const returnOrder = async (req, res) => {
  try {
    const id = req.query.id;
    const { returnReason } = req.body;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    order.returnAll = true;
    order.returnReason = returnReason;
    order.orderStatus = "returned";
    order.products.forEach((product) => {
      product.returnProduct = true;
    });

    if (order.paymentMethod != "cod") {
      const userId = req.session.userData;
      // console.log(`refunding the user...`);
      // const existingProduct = await Products.findById(productId);
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        // console.log(
        //   `no wallet found for the user, creating new wallet for the user..`
        // );
        wallet = new Wallet({ userId: userId, transactions: [] });
      }
      // console.log(`user wallet : ${wallet}`);

      const transaction = {
        transactionType: "Credit",
        amount: order.billTotal,
        description: `The order ${order.orderId} was returned and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.walletBalance += order.billTotal;
      wallet.transactions.push(transaction);
      // console.log(`user wallet after entering the transaction : ${wallet}`);

      wallet.save();
    }

    await order.save();

    res.status(200).json({
      message: "Order product canceled successfully",
    });
  } catch (error) {
    console.log(`error returning order : ${error}`);
  }
};

// Load order details in order management.
const loadOrderDetails = async (req, res) => {
  const { id } = req.query;
  const user = req.session.adminData;
  const products = await Products.find({ isUnlisted: false });
  const categories = await Category.find({ isUnlisted: false });
  const orders = await Order.find({ _id: id }).sort({ createdOn: -1 });

  let google;
  req.user
    ? ((google = true), (logout = "/auth/logout"))
    : ((google = false), (logout = "/logout"));

  res.render("order_details", {
    categories: categories,
    products: products,
    orders,
  });
};

// Change order status in admin side.
const changeStatus = async (req, res) => {
  const { orderId, status, productId } = req.query;

  try {
    const order = await Order.findById(orderId);
    // let product = order.products.find(
    //   (product) => product.productId === productId
    // );
    // product.productStatus = status;

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    order.orderStatus = status;
    // order.orderStatus = `partially-${status}`;
    await order.save();
    res.status(200).json({
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Check wallet balance.
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.query.userId;
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.status(200).json({ walletBalance: wallet.walletBalance });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
};

module.exports = {
  addOrder,
  loadOrderManagement,
  loadSingleOrder,
  cancelProduct,
  cancelOrder,
  returnProduct,
  loadReturnSingleOrder,
  returnOrder,
  loadOrderDetails,
  changeStatus,
  getWalletBalance,
  razorpayAddOrder,
};
