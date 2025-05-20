const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Wallet = require("../models/walletModel");
const Coupon = require("../models/couponModel");
require("dotenv").config();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const PDFDocument = require("pdfkit");

const Razorpay = require("razorpay");
const Product = require("../models/productModel");
const { RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_KEY,
});

// Add order.
const addOrder = async (req, res) => {
  try {
    let {
      user,
      orderId,
      products,
      orderStatus,
      billTotal,
      shippingCharge,
      address,
      paymentMethod,
      paymentStatus,
      createdOn,
      showDate,
      coupon,
    } = req.body;

    let discount = null;

    let noDiscountAmount = 0;
    let prods = [];

    for (const product of products) {
      let dataProd = await Product.findById(product.productId);
      let price;

      if (dataProd.price == 0) {
        price = Math.min(dataProd.offerPrice, dataProd.categoryDiscountPrice);
      } else if (dataProd.offerPrice == 0) {
        price = Math.min(dataProd.price, dataProd.categoryDiscountPrice);
      } else if (dataProd.categoryDiscountPrice == 0) {
        price = Math.min(dataProd.price, dataProd.offerPrice);
      } else {
        price = Math.min(
          dataProd.price,
          dataProd.offerPrice,
          dataProd.categoryDiscountPrice
        );
      }

      product.price = price;
      product.subtotal = price * product.quantity;
      noDiscountAmount += product.price * product.quantity;
      prods.push(product);
    }

    let discountAmount = noDiscountAmount + shippingCharge - billTotal;
    discount === null
      ? (discount += discountAmount)
      : (discount = discountAmount);

    const newOrder = new Order({
      user,
      orderId,
      products: prods,
      orderStatus,
      billTotal,
      beforeDiscount: noDiscountAmount,
      shippingCharge: shippingCharge || 0,
      discount,
      address,
      paymentMethod,
      paymentStatus,
      createdOn,
      showDate,
    });

    const id = req.user || req.session.userData;

    if (coupon) {
      const cpn = await Coupon.findById(coupon);
      cpn.usedList.push(id);
      await cpn.save();
    }

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
    } else if (newOrder.paymentMethod === "razorpay") {
      let options = {
        amount: parseFloat(newOrder.billTotal) * 100,
        currency: "INR",
        receipt: newOrder.orderId,
      };

      razorpayInstance.orders.create(options, function (err, order) {
        if (!err) {
          console.log("order :", order);
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

    let noDiscountAmount = 0;
    newOrder.products.forEach((product) => {
      noDiscountAmount += product.price * product.quantity;
    });
    let discountAmount = noDiscountAmount - newOrder.billTotal;
    newOrder.discount === null
      ? (newOrder.discount += discountAmount)
      : (newOrder.discount = discountAmount);

    await newOrder.save();
    await Cart.findOneAndDelete({ userID: id });
    res.status(201).json({
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
      .limit(limit)
      .sort({ createdOn: -1 });

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

const cancelProduct = async (req, res) => {
  console.log(`canceling the product from the order...`);
  try {
    const { orderId, productId } = req.params;
    const { cancelReason } = req.body;
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
    console.log("order : ", order);
    console.log(`payment status : ${order.paymentStatus}`);

    if (order.paymentMethod != "cod" && order.paymentStatus == "Success") {
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        wallet = new Wallet({ userId: userId, transactions: [] });
      }

      wallet.walletBalance += firstBill - order.billTotal;

      const transaction = {
        transactionType: "Credit",
        amount: order.billTotal,
        description: `The product ${existingProduct.name} was cancelled of the order ${order.orderId} and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.transactions.push(transaction);

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

const cancelOrder = async (req, res) => {
  try {
    const id = req.query.id;
    const { cancelReason } = req.body;
    const order = await Order.findById(id);

    const firstBill = order.billTotal;

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    order.products.forEach(async function (product) {
      const existingProduct = await Products.findById(product.productId);
      existingProduct.stock += product.quantity;
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
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        wallet = new Wallet({ userId: userId, transactions: [] });
      }

      const transaction = {
        transactionType: "Credit",
        amount: firstBill,
        description: `The order ${order.orderId} was canceled and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.walletBalance += firstBill;
      wallet.transactions.push(transaction);

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
    product.returnProduct = true;
    product.returnReason = returnReason;
    order.orderStatus = "partially-returned";
    order.billTotal -= product.price * product.quantity;
    const allProductsReturned = order.products.every((p) => p.returnProduct);
    if (allProductsReturned) {
      order.orderStatus = "returned";
      order.returnAll = true;
    }

    const userId = req.session.userData || req.user?.id;

    if (order.paymentMethod != "cod") {
      const existingProduct = await Products.findById(productId);
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        wallet = new Wallet({ userId: userId, transactions: [] });
      }

      const transaction = {
        transactionType: "Credit",
        amount: firstBill - order.billTotal,
        description: `The product ${existingProduct.name} was returned of the order ${order.orderId} and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.walletBalance += firstBill - order.billTotal;
      wallet.transactions.push(transaction);
      wallet.save();
    }

    await order.save();

    res
      .status(200)
      .json({ message: "Product returned successfully", allProductsReturned });
  } catch (error) {
    console.log(`Error returning a product: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        wallet = new Wallet({ userId: userId, transactions: [] });
      }

      const transaction = {
        transactionType: "Credit",
        amount: Math.floor(order.billTotal),
        description: `The order ${order.orderId} was returned and ${order.billTotal} was credited to your wallet`,
        orderId: order.orderId,
      };

      wallet.walletBalance += order.billTotal;
      wallet.transactions.push(transaction);

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

const changeStatus = async (req, res) => {
  const { orderId, status, productId } = req.query;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    order.orderStatus = status;
    await order.save();
    res.status(200).json({
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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

const retryPayment = async (req, res) => {
  const { order } = req.body;

  try {
    const payment_capture = 1;
    const amount = order.billTotal * 100;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: order.orderId,
      payment_capture,
    };

    const response = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      order_id: response.id,
      amount: response.amount,
      currency: response.currency,
      key_id: razorpayInstance.key_id,
      description: "Payment for order " + order.orderId,
      contact: 8848746391,
      name: order.name,
      email: order.email,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create Razorpay order" });
  }
};

const updatePayment = async (req, res) => {
  console.log("updating payment status");
  const { orderId, status } = req.body;
  console.log("req.body", req.body);

  try {
    await Order.findByIdAndUpdate(orderId, { paymentStatus: status });
    status != "Failed"
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update payment status" });
  }
};

// const downloadInvoice = async (req, res) => {
//   try {
//     const { orderId } = req.query;
//     const order = await Order.findById(orderId).populate("products.productId");

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     const templatePath = path.resolve(__dirname, "../views/users/invoice.ejs");
//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template not found: ${templatePath}`);
//     }

//     const html = await ejs.renderFile(templatePath, { order });
//     const browser = await launchBrowser();

//     const page = await browser.newPage();
//     await page.setContent(html);
//     await page.screenshot({ path: "debug_rendered_page.png" });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       preferCSSPageSize: true,
//     });

//     if (pdfBuffer.length === 0) {
//       throw new Error("Generated PDF buffer is empty.");
//     }

//     await browser.close();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${orderId}.pdf`
//     );
//     res.setHeader("Content-Length", pdfBuffer.length);
//     res.end(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating the invoice:", error.message, error.stack);
//     res.status(500).json({
//       error: "Failed to download the invoice",
//       details: error.message,
//     });
//   }
// };

// const downloadInvoice = async (req, res) => {
//   try {
//     console.log("Starting invoice download process with PDFKit");
//     const { orderId } = req.query;
//     console.log(`Fetching order with ID: ${orderId}`);

//     const order = await Order.findById(orderId).populate("products.productId");

//     if (!order) {
//       console.log(`Order not found: ${orderId}`);
//       return res.status(404).json({ error: "Order not found" });
//     }

//     console.log("Found order, generating PDF");

//     // Create a PDF document
//     const doc = new PDFDocument({ margin: 50 });

//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

//     // Pipe PDF to response
//     doc.pipe(res);

//     // Add invoice header
//     doc.fontSize(24).text('INVOICE', { align: 'center' });
//     doc.moveDown();

//     // Add company info
//     doc.fontSize(12)
//       .text('Watch Company', { align: 'right' })
//       .text('watchcompany.onrender.com', { align: 'right' })
//       .text('support@watchcompany.com', { align: 'right' })
//       .moveDown();

//     // Add order info
//     doc.fontSize(12)
//       .text(`Invoice Number: ${order.orderId}`)
//       .text(`Order Date: ${order.showDate || new Date(order.orderDate).toLocaleDateString()}`)
//       .text(`Payment Method: ${
//         order.paymentMethod === 'razorpay' ? 'Razor Pay' :
//         order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Wallet'
//       }`)
//       .text(`Payment Status: ${order.paymentStatus}`)
//       .text(`Order Status: ${order.orderStatus}`)
//       .moveDown();

//     // Add customer info
//     doc.text('Shipping Address:')
//       .text(`Name: ${order.address.houseName}`)
//       .text(`Address: ${order.address.street}, ${order.address.city}`)
//       .text(`${order.address.state}, ${order.address.country}, ${order.address.pincode}`)
//       .text(`Phone: ${order.address.phoneNumber}`)
//       .moveDown();

//     // Add product table headers
//     doc.font('Helvetica-Bold');
//     let y = doc.y;
//     doc.text('Product', 50, y);
//     doc.text('Quantity', 300, y);
//     doc.text('Price', 380, y);
//     doc.text('Total', 480, y);
//     doc.moveDown();

//     // Add horizontal line
//     doc.strokeColor('#aaaaaa')
//       .lineWidth(1)
//       .moveTo(50, doc.y)
//       .lineTo(550, doc.y)
//       .stroke();
//     doc.moveDown();

//     doc.font('Helvetica');

//     // Add product rows
//     let totalItems = 0;

//     order.products.forEach(item => {
//       y = doc.y;
//       const productName = item.productName || (item.productId ? item.productId.name : 'Unknown Product');
//       doc.text(productName, 50, y, { width: 230 });
//       doc.text(item.quantity.toString(), 300, y);
//       doc.text(`₹${item.price}`, 380, y);
//       doc.text(`₹${item.price * item.quantity}`, 480, y);
//       doc.moveDown();

//       totalItems += item.quantity;
//     });

//     // Add divider before totals
//     doc.strokeColor('#aaaaaa')
//       .lineWidth(1)
//       .moveTo(50, doc.y)
//       .lineTo(550, doc.y)
//       .stroke();
//     doc.moveDown();

//     // Add total section
//     doc.font('Helvetica');
//     doc.text(`Subtotal (${totalItems} items): ${order.beforeDiscount}`, 350, doc.y);
//     if (order.discount > 0) {
//       doc.text(`Discount: ₹${order.discount}`, 350, doc.y + 20);
//       doc.moveDown();
//     }
//     doc.text(`Shipping: ${order.shippingCharge}`, 350, doc.y);
//     doc.moveDown();

//     // Final total with bold font
//     doc.font('Helvetica-Bold');
//     doc.text(`Total: ${order.billTotal}`, 350, doc.y);
//     doc.moveDown();

//     // Add footer
//     doc.moveDown(2);
//     doc.font('Helvetica');
//     doc.fontSize(10).text('Thank you for shopping with Watch Company!', { align: 'center' });
//     doc.text('For any questions regarding this invoice, please contact customer support.', { align: 'center' });

//     // Add terms and conditions
//     doc.moveDown(2);
//     doc.fontSize(8)
//       .text('Terms & Conditions:', { align: 'center' })
//       .text('This is an electronic generated invoice and does not require a physical signature.', { align: 'center' });

//     // Finalize PDF
//     doc.end();
//     console.log("PDF sent successfully");

//   } catch (error) {
//     console.error("Error generating the invoice:", error.message);
//     console.error("Full error stack:", error.stack);

//     res.status(500).json({
//       error: "Failed to download the invoice",
//       details: error.message
//     });
//   }
// };

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = await Order.findById(orderId).populate("products.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    let sub_tot = 0;
    order.products.forEach((prod) => {
      sub_tot += prod.subtotal;
    });
    const grand_tot = sub_tot - Math.abs(order.discount);

    // Create a document with letter size and reduced margins
    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      bufferPages: true, // Enable page buffering for footer
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Page dimensions
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 60; // 30px margin on each side

    // Define a custom font if available
    // If you have the Cormorant Garamond font file, you could register it:
    // doc.registerFont('CormorantGaramond', 'path/to/CormorantGaramond.ttf');

    // ----- HEADER SECTION -----
    // Create a table-like structure for the top section
    doc.lineWidth(1);

    // Top border of the table
    doc
      .moveTo(30, 30)
      .lineTo(pageWidth - 30, 30)
      .stroke();

    // Left column (company name)
    doc.rect(30, 30, contentWidth / 2, 80).stroke();
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("Watch Company", 60, 60, { width: contentWidth / 2 - 30 });

    // Right column (order details)
    doc.rect(30 + contentWidth / 2, 30, contentWidth / 2, 80).stroke();
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Order ID : ${order.orderId}`, contentWidth / 2 + 60, 50)
      .text(
        `Purchase Date : ${
          order.showDate || new Date(order.orderDate).toLocaleDateString()
        }`,
        contentWidth / 2 + 60,
        70
      );

    // Bottom border of the table
    doc
      .moveTo(30, 110)
      .lineTo(pageWidth - 30, 110)
      .stroke();

    // ----- INFORMATION SECTION -----
    const infoY = 140;

    // Left column (Delivery Address)
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Delivery Address :", 30, infoY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(order.address.houseName, 30, infoY + 20)
      .text(order.address.street, 30, infoY + 35)
      .text(
        `${order.address.state}, ${order.address.country} - ${order.address.pincode}`,
        30,
        infoY + 50
      )
      .text(`ph: ${order.address.phoneNumber}`, 30, infoY + 65);

    // Right column (From)
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("From :", contentWidth / 2 + 60, infoY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Watch Company", contentWidth / 2 + 60, infoY + 20)
      .text("Ernakulam, Kerala", contentWidth / 2 + 60, infoY + 35)
      .text("watchcompany2024@gmail.com", contentWidth / 2 + 60, infoY + 50);

    // Bottom border of the information section
    doc
      .moveTo(30, infoY + 95)
      .lineTo(pageWidth - 30, infoY + 95)
      .stroke();

    // Payment method
    const paymentY = infoY + 110;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Payment Method : ${
          order.paymentMethod === "razorpay"
            ? "RazorPay"
            : order.paymentMethod === "cod"
            ? "Cash on Delivery"
            : "Wallet"
        }`,
        30,
        paymentY
      );

    // ----- ITEMS TABLE -----
    const tableY = paymentY + 25;
    const tableHeaders = [
      "No.",
      "Product Name",
      "Price",
      "Quantity",
      "Sub-total",
    ];
    const columnWidths = [40, 200, 100, 80, 110]; // Adjusted for better fit
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const startX = 30;

    // Draw table header with gray background
    doc
      .rect(startX, tableY, tableWidth, 25)
      .fillAndStroke("#eeeeee", "#000000");

    // Header text
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
    let currentX = startX;

    // Align the headers according to design
    const alignments = ["center", "center", "center", "center", "end"];

    tableHeaders.forEach((header, i) => {
      let textOptions = { width: columnWidths[i] };
      if (alignments[i] === "center") {
        textOptions.align = "center";
      } else if (alignments[i] === "end") {
        textOptions.align = "right";
      }

      doc.text(header, currentX, tableY + 8, textOptions);
      currentX += columnWidths[i];
    });

    // Draw table rows
    let currentY = tableY + 25;
    let subTotal = 0;

    // Products
    order.products.forEach((item, index) => {
      const productName =
        item.productName ||
        (item.productId ? item.productId.name : "Unknown Product");
      const lineItemTotal = item.price * item.quantity;

      currentX = startX;

      // Item number
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(String(index + 1), currentX, currentY, {
          width: columnWidths[0],
          align: "center",
        });
      currentX += columnWidths[0];

      // Product name
      doc.text(productName, currentX, currentY, {
        width: columnWidths[1],
        align: "center",
      });
      currentX += columnWidths[1];

      // Price
      doc.text(`₹ ${item.price}`, currentX, currentY, {
        width: columnWidths[2],
        align: "center",
      });
      currentX += columnWidths[2];

      // Quantity
      doc.text(String(item.quantity), currentX, currentY, {
        width: columnWidths[3],
        align: "center",
      });
      currentX += columnWidths[3];

      // Subtotal
      doc.text(`₹ ${lineItemTotal}`, currentX, currentY, {
        width: columnWidths[4],
        align: "right",
      });

      // Draw bottom border for the row
      currentY += 20; // Increase row height for better spacing
      doc
        .moveTo(startX, currentY)
        .lineTo(startX + tableWidth, currentY)
        .stroke();

      subTotal += lineItemTotal;
    });

    // ----- TOTALS SECTION -----
    // Position the totals on the right side
    const totalsStartX =
      startX + columnWidths[0] + columnWidths[1] + columnWidths[2];
    const totalsWidth = columnWidths[3] + columnWidths[4];

    // Subtotal
    currentY += 15;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Sub-Total : ", totalsStartX, currentY, {
        width: columnWidths[3],
        align: "right",
      })
      .text(`₹ ${subTotal}`, totalsStartX + columnWidths[3], currentY, {
        width: columnWidths[4],
        align: "right",
      });

    // Discount
    currentY += 20;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Discount : ", totalsStartX, currentY, {
        width: columnWidths[3],
        align: "right",
      })
      .text(
        `₹ ${order.discount || 0}`,
        totalsStartX + columnWidths[3],
        currentY,
        { width: columnWidths[4], align: "right" }
      );

    // Grand total with border on top
    currentY += 20;
    doc
      .moveTo(totalsStartX, currentY)
      .lineTo(totalsStartX + totalsWidth, currentY)
      .stroke();
    currentY += 5;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Grand Total: ", totalsStartX, currentY, {
        width: columnWidths[3],
        align: "right",
      })
      .text(`₹ ${grand_tot}`, totalsStartX + columnWidths[3], currentY, {
        width: columnWidths[4],
        align: "right",
      });

    // ----- FOOTER -----
    // Thank you message
    currentY += 50;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "-----------------------------------------------Thank you for your purchase--------------------------------------------------",
        30,
        currentY,
        { align: "center", width: contentWidth }
      );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating the invoice:", error.message, error.stack);
    res.status(500).json({
      error: "Failed to download the invoice",
      details: error.message,
    });
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
  retryPayment,
  updatePayment,
  downloadInvoice,
};
