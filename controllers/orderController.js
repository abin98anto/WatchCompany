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
  // console.log(`cancelling a product`);
  const { orderId, productId } = req.params;
  const { cancelReason } = req.body;
  // console.log(
  // `orderId : ${orderId}, productid : ${productId}, cancel reason : ${cancelReason}`
  // );
  try {
    const order = await Order.findById(orderId);
    // console.log(`order : ${order}`);
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

    // const existingProduct = await product.findById(productId);
    // console.log(`existing prod : ${existingProduct}`);
    // if (!existingProduct) {
    //   return res.status(404).json({ error: "Product not found" });
    // }

    // existingProduct.stock += product.quantity;

    order.orderStatus = "partially-cancelled";
    order.billTotal -= product.price * product.quantity;
    product.cancelProduct = true;
    product.cancelReason = cancelReason;
    const allProductsCanceled = order.products.every((p) => p.cancelProduct);

    if (allProductsCanceled) {
      order.cancelAll = true;
    }

    // console.log(`exisiting prod after : ${existingProduct}`);
    // console.log(`order after : ${existingProduct}`);
    // await existingProduct.save();
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
    console.log(`in the server cancelling order.`);
    const id = req.query.id;
    const { cancelReason } = req.body;
    console.log(`is : ${id} cancel reason : ${cancelReason}`);
    const order = await Order.findById(id);
    console.log(`order : ${order}`);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    order.cancelAll = true;
    order.cancelReason = cancelReason;
    order.orderStatus = "cancelled";
    order.products.forEach((product) => {
      product.cancelProduct = true;
    });

    await order.save();
    console.log(`order after save  : ${order}`);
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
    // console.log(orders[0]);

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

    // Update the product within the order
    product.returnProduct = true;
    product.returnReason = returnReason;
    order.orderStatus = "partially-returned";
    order.billTotal -= product.price * product.quantity;

    // Check if all products in the order are returned
    const allProductsReturned = order.products.every((p) => p.returnProduct);

    // Update order status if necessary
    if (allProductsReturned) {
      order.orderStatus = "returned"; // Or set to another appropriate status
      order.returnAll = true;
    }

    // Save changes to the product and order
    await order.save();
    // await Product.findByIdAndUpdate(productId, product); // Assuming Product model is used

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

// Change order status
const changeStatus = async (req, res) => {
  const { id, status } = req.query;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    // console.log(`status : ${status}`);
    // Update the order status
    order.orderStatus = status;
    // console.log(`order before : ${order}`);
    await order.save();
    // console.log(`order : ${order}`);
    // Send updated order status as response
    res.status(200).json({
      message: "Order status updated successfully",
      // newStatus: order.orderStatus,
    });
  } catch (error) {
    // Handle errors
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
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
};
