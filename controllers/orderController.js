const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");

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

    await Cart.deleteOne({ userID: id });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Load Order Management.
const loadOrderManagement = async (req, res) => {
  try {
    const orders = await Order.find().populate("user");
    res.render("order_management", { orders });
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
    // console.log(orders[0]);

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
  // console.log(`cancelling the product`);
  const { orderId, productId } = req.params;
  const { cancelReason } = req.body;
  // console.log(
  //   `orderId: ${orderId}, product id : ${productId}, cancel reason: ${cancelReason}`
  // );

  try {
    const order = await Order.findById(orderId);
    console.log(`order : ${order}`);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const product = order.products.find(
      (p) => p.productId.toString() === productId
    );
    // console.log(`product : ${product}`);
    if (!product) {
      return res.status(404).json({ error: "Product not found in order" });
    }

    const id = productId;

    const existingProduct = await Products.findById(id);
    // console.log(`existing product : ${existingProduct}`);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Increase product stock (quantity) in Product model
    existingProduct.stock += product.quantity;
    // console.log(`after quantity increase : ${existingProduct}`);
    await existingProduct.save();

    // Update order's billTotal by subtracting canceled product's price
    order.billTotal -= product.price * product.quantity;
    // console.log(`order after bill total change : ${order}`);
    // Update product's cancelProduct and cancelReason in Order model
    product.cancelProduct = true;
    product.cancelReason = cancelReason;
    // console.log(`order after canceling : ${order}`);
    // Save changes to order
    const allProductsCanceled = order.products.every((p) => p.cancelProduct);

    // If all products are canceled, update cancelAll to true
    if (allProductsCanceled) {
      order.cancelAll = true;
      order.orderStatus = "cancelled";
    }

    await order.save();

    res.status(200).json({
      message: "Order product canceled successfully",
      allProductsCanceled,
    });
    // res.status(200).json({ message: "Order product cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  addOrder,
  loadOrderManagement,
  loadSingleOrder,
  cancelProduct,
};
