const Order = require("../models/orderModel");

// Add order.
const addOrder = async (req, res) => {
  console.log(`Creating a new order..`);
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

module.exports = { addOrder, loadOrderManagement };
