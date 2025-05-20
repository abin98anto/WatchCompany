const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");
const ejs = require("ejs");
const Order = require("../models/orderModel");

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = await Order.findById(orderId).populate("products.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create a PDF document with slightly larger margins to match design
    const doc = new PDFDocument({ margin: 30 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Page settings
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 60; // 30px margin on each side

    // Top section with company name and order details
    doc.rect(30, 30, contentWidth, 100).stroke();

    // Company logo/name on left side (styled box)
    doc.rect(30, 30, contentWidth / 2, 100).stroke();
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Watch Company", 45, 65, { width: contentWidth / 2 - 30 });

    // Order details on right side
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Order ID : ${order.orderId}`, contentWidth / 2 + 45, 50)
      .text(
        `Purchase Date : ${
          order.showDate || new Date(order.orderDate).toLocaleDateString()
        }`,
        contentWidth / 2 + 45,
        70
      );

    // Information section
    const infoY = 150;

    // Delivery address
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Delivery Address :", 30, infoY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`${order.address.houseName}`, 30, infoY + 20)
      .text(`${order.address.street}`, 30, infoY + 35)
      .text(
        `${order.address.state}, ${order.address.country} - ${order.address.pincode}`,
        30,
        infoY + 50
      )
      .text(`ph: ${order.address.phoneNumber}`, 30, infoY + 65);

    // From address (company details)
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("From :", contentWidth / 2 + 45, infoY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Watch Company", contentWidth / 2 + 45, infoY + 20)
      .text("Ernakulam, Kerala", contentWidth / 2 + 45, infoY + 35)
      .text("watchcompany2024@gmail.com", contentWidth / 2 + 45, infoY + 50);

    // Payment method
    const paymentY = infoY + 100;
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

    // Items table
    const tableY = paymentY + 30;
    const tableHeaders = [
      "No.",
      "Product Name",
      "Price",
      "Quantity",
      "Sub-total",
    ];
    const columnWidths = [40, 220, 90, 90, 90];
    const startX = 30;

    // Draw table header with gray background
    doc.rect(startX, tableY, contentWidth, 25).fill("#eeeeee");

    // Header text
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
    let currentX = startX;

    // Align the headers according to design
    const alignments = ["center", "center", "center", "center", "right"];

    tableHeaders.forEach((header, i) => {
      let textOptions = { width: columnWidths[i] };
      if (alignments[i] === "center") {
        textOptions.align = "center";
      } else if (alignments[i] === "right") {
        textOptions.align = "right";
      }

      doc.text(header, currentX + 5, tableY + 8, textOptions);
      currentX += columnWidths[i];
    });

    // Draw table rows
    let currentY = tableY + 25;
    let subTotal = 0;

    // Products
    order.products.forEach((item, index) => {
      currentX = startX;
      const productName =
        item.productName ||
        (item.productId ? item.productId.name : "Unknown Product");
      const lineItemTotal = item.price * item.quantity;
      const rowData = [
        index + 1,
        productName,
        `₹ ${item.price}`,
        item.quantity,
        `₹ ${lineItemTotal}`,
      ];

      doc.fontSize(10).font("Helvetica");

      rowData.forEach((text, i) => {
        let textOptions = { width: columnWidths[i] };
        if (alignments[i] === "center") {
          textOptions.align = "center";
        } else if (alignments[i] === "right") {
          textOptions.align = "right";
        }

        doc.text(text.toString(), currentX + 5, currentY + 5, textOptions);
        currentX += columnWidths[i];
      });

      // Draw bottom border for the row
      doc
        .moveTo(startX, currentY + 25)
        .lineTo(startX + contentWidth, currentY + 25)
        .stroke();

      currentY += 25;
      subTotal += lineItemTotal;
    });

    // Totals section
    const totalsX =
      startX +
      columnWidths[0] +
      columnWidths[1] +
      columnWidths[2] +
      columnWidths[3];
    const totalsWidth = columnWidths[4];

    // Subtotal
    currentY += 10;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Sub-Total : ₹", totalsX, currentY, {
        align: "right",
        width: totalsWidth - 40,
      })
      .text(`${subTotal}`, totalsX + totalsWidth - 35, currentY);

    // Discount
    currentY += 25;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Discount : ₹", totalsX, currentY, {
        align: "right",
        width: totalsWidth - 40,
      })
      .text(`${order.discount || 0}`, totalsX + totalsWidth - 35, currentY);

    // Grand total
    currentY += 25;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Grand Total: ₹", totalsX, currentY, {
        align: "right",
        width: totalsWidth - 40,
      })
      .text(`${order.billTotal}`, totalsX + totalsWidth - 35, currentY);

    // Thank you message
    currentY += 50;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "-----------------------------------------------Thank you for your puchase--------------------------------------------------",
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

module.exports = { downloadInvoice };
