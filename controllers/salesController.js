const Orders = require("../models/orderModel");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const loadSalesReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 5;
    const filter = req.query.filter || "all";
    const fromDate = req.query.fromDate || "";
    const toDate = req.query.toDate || "";

    let startDate;
    let endDate = toDate ? new Date(toDate) : new Date();

    if (fromDate) {
      startDate = new Date(fromDate);
    } else if (filter === "month") {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    } else if (filter === "week") {
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
    } else if (filter === "day") {
      startDate = new Date(endDate);
      startDate.setHours(0, 0, 0, 0);
    }

    let query = { orderStatus: "Delivered" };

    if (filter !== "all" || fromDate || toDate) {
      query.createdOn = { $gte: startDate, $lte: endDate };
    }

    const sales = await Orders.find(query)
      .populate("user")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdOn: -1 });

    const totalSales = await Orders.countDocuments(query);
    const totalPages = Math.ceil(totalSales / pageSize);

    res.render("sales_report", {
      sales,
      currentPage: page,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
      filter,
      fromDate,
      toDate,
    });
  } catch (error) {
    console.log(`error loading the sales report : ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

function generatePDF(data, res, totalDiscount, totalSales, totalSalesCount) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 10 });
  doc.pipe(res);

  const { width, height } = doc.page;
  doc.rect(10, 10, width - 20, height - 20).stroke();

  const logoPath = path.join(
    ".",
    "public",
    "user_assets",
    "imgs",
    "theme",
    "watchcompany_logo.svg"
  );

  sharp(logoPath)
    .resize(100)
    .png()
    .toBuffer((err, buffer) => {
      if (err) {
        console.error("Error converting logo:", err);
        addHeaderAndTable(
          doc,
          width,
          data,
          totalDiscount,
          totalSales,
          totalSalesCount
        );
      } else {
        doc.image(buffer, width / 2 - 50, 20, { width: 100 });
        addHeaderAndTable(
          doc,
          width,
          data,
          totalDiscount,
          totalSales,
          totalSalesCount
        );
      }
    });
}

function addHeaderAndTable(
  doc,
  width,
  data,
  totalDiscount,
  totalSales,
  totalSalesCount
) {

  const lineThickness = 1;
  const thickBorderThickness = 3;

  doc
    .moveTo(10, 95)
    .lineTo(width - 10, 95)
    .lineWidth(lineThickness)
    .stroke();
  doc
    .moveTo(10, 130)
    .lineTo(width - 10, 130)
    .lineWidth(lineThickness)
    .stroke();

  doc.moveDown(7).fontSize(16).text("Sales Report", { align: "center" });

  doc.moveDown();

  doc.fontSize(10);

  const tableHeaders = [
    "No.",
    "User Name",
    "Order ID",
    "Products",
    "Payment Method",
    "Quantity",
    "Product Price",
    "Sub Total",
    "Purchase Date",
  ];

  let y = 180;
  const xStart = 30;

  const columnWidths = [
    30,
    100,
    80,
    150,
    100,
    60,
    80,
    80,
    100,
  ];

  const rowHeight = 20;

  doc
    .rect(
      xStart,
      y - rowHeight,
      columnWidths.reduce((a, b) => a + b, 0),
      rowHeight
    )
    .fill("#e0e0e0")
    .stroke();
  doc.fillColor("black");

  tableHeaders.forEach((header, index) => {
    const x = xStart + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
    doc.text(header, x, y - rowHeight + (rowHeight - 10) / 2, {
      width: columnWidths[index],
      align: "center",
    });
    if (index < tableHeaders.length - 1) {
      doc
        .moveTo(x + columnWidths[index], y - rowHeight)
        .lineTo(x + columnWidths[index], y)
        .lineWidth(lineThickness)
        .stroke();
    }
  });
  doc
    .moveTo(xStart, y)
    .lineTo(xStart + columnWidths.reduce((a, b) => a + b, 0), y)
    .lineWidth(lineThickness)
    .stroke();

  data.forEach((sale, index) => {
    const rowData = [
      index + 1,
      sale.user,
      sale.orderId,
      sale.products.map((p) => p.productName).join(", "),
      sale.paymentMethod,
      sale.products.map((p) => p.quantity).join(", "),
      sale.products.map((p) => p.price).join(", "),
      sale.products.reduce((acc, cur) => acc + cur.quantity * cur.price, 0),
      sale.createdOn.toDateString(),
    ];

    doc
      .rect(
        xStart,
        y,
        columnWidths.reduce((a, b) => a + b, 0),
        rowHeight
      )
      .fill("#f5f5f5")
      .stroke();
    doc.fillColor("black");

    rowData.forEach((data, colIndex) => {
      const x =
        xStart + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
      doc.text(data, x, y + (rowHeight - 10) / 2, {
        width: columnWidths[colIndex],
        align: "center",
      });
      if (colIndex < rowData.length - 1) {
        doc
          .moveTo(x + columnWidths[colIndex], y)
          .lineTo(x + columnWidths[colIndex], y + rowHeight)
          .lineWidth(lineThickness)
          .stroke();
      }
    });
    y += rowHeight;
    doc
      .moveTo(xStart, y)
      .lineTo(xStart + columnWidths.reduce((a, b) => a + b, 0), y)
      .lineWidth(lineThickness)
      .stroke();
  });

  doc
    .moveTo(
      xStart + columnWidths.reduce((a, b) => a + b, 0),
      y - rowHeight * data.length
    )
    .lineTo(xStart + columnWidths.reduce((a, b) => a + b, 0), y)
    .lineWidth(lineThickness)
    .stroke();

  y += 30;
  const summaryWidth = 300;
  const summaryXStart = (width - summaryWidth) / 2;
  const summaryYStart = y;

  const summaryBoxHeight = 4 * rowHeight;
  doc
    .rect(summaryXStart, summaryYStart, summaryWidth, summaryBoxHeight)
    .lineWidth(thickBorderThickness)
    .stroke();

  doc
    .rect(summaryXStart, summaryYStart, summaryWidth, rowHeight)
    .fill("#e0e0e0")
    .stroke();
  doc.fillColor("black");

  doc
    .fontSize(12)
    .text(
      "Sales Summary",
      summaryXStart,
      summaryYStart + (rowHeight - 12) / 2,
      { align: "center", width: summaryWidth }
    );

  doc
    .moveTo(summaryXStart, summaryYStart + rowHeight)
    .lineTo(summaryXStart + summaryWidth, summaryYStart + rowHeight)
    .lineWidth(lineThickness)
    .stroke();

  const summaryColumnWidth = summaryWidth / 2;
  doc
    .moveTo(summaryXStart + summaryColumnWidth, summaryYStart + rowHeight)
    .lineTo(
      summaryXStart + summaryColumnWidth,
      summaryYStart + summaryBoxHeight
    )
    .lineWidth(lineThickness)
    .stroke();

  const summaryHeaders = [
    ["Total Discount", "$ " + totalDiscount.toFixed(2)],
    ["Total Sales", "$ " + totalSales.toFixed(2)],
    ["Total Sales Count", totalSalesCount.toString()],
  ];

  y = summaryYStart + rowHeight;

  summaryHeaders.forEach((summaryRow) => {
    summaryRow.forEach((data, colIndex) => {
      const x = summaryXStart + colIndex * summaryColumnWidth;
      doc.text(data, x, y + (rowHeight - 10) / 2, {
        width: summaryColumnWidth,
        align: "center",
      });
      if (colIndex < summaryRow.length - 1) {
        doc
          .moveTo(x + summaryColumnWidth, y)
          .lineTo(x + summaryColumnWidth, y + rowHeight)
          .lineWidth(lineThickness)
          .stroke();
      }
    });
    y += rowHeight;
    doc
      .moveTo(summaryXStart, y)
      .lineTo(summaryXStart + summaryWidth, y)
      .lineWidth(lineThickness)
      .stroke();
  });

  doc.end();
}

const downloadReport = async (req, res) => {
  const { fromDate, toDate, page = 1, filter, format } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  let query = { orderStatus: "Delivered" };

  if (fromDate && toDate) {
    query.createdOn = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  } else {
    const now = new Date();
    if (filter === "day") {
      query.createdOn = {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lte: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (filter === "week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      query.createdOn = {
        $gte: startOfWeek,
        $lte: endOfWeek,
      };
    } else if (filter === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startOfMonth.setHours(0, 0, 0, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      query.createdOn = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }
  }

  try {
    const sales = await Orders.find(query)
      .populate("user")
      .skip(skip)
      .limit(limit);

    const totalDiscount = sales.reduce(
      (acc, sale) =>
        acc +
        (sale.products.reduce(
          (acc, product) => acc + product.quantity * product.price,
          0
        ) -
          sale.billTotal),
      0
    );
    const totalSales = sales.reduce((acc, sale) => acc + sale.billTotal, 0);
    const totalSalesCount = sales.reduce(
      (acc, sale) =>
        acc + sale.products.reduce((acc, product) => acc + product.quantity, 0),
      0
    );

    if (format === "pdf") {
      const data = sales.map((sale) => ({
        user: sale.user.name,
        orderId: sale.orderId,
        products: sale.products,
        paymentMethod: sale.paymentMethod,
        createdOn: sale.createdOn,
      }));
      generatePDF(data, res, totalDiscount, totalSales, totalSalesCount);
    } else if (format === "excel") {
      const worksheetData = sales.map((sale, index) => ({
        "No.": index + 1,
        "User Name": sale.user.name,
        "Order ID": sale.orderId,
        Products: sale.products.map((p) => p.productName).join(", "),
        "Payment Method": sale.paymentMethod,
        Quantity: sale.products.map((p) => p.quantity).join(", "),
        "Product Price": sale.products.map((p) => p.price).join(", "),
        "Sub Total": sale.products
          .reduce((acc, cur) => acc + cur.quantity * cur.price, 0)
          .toFixed(2),
        Discount: (
          sale.products.reduce(
            (acc, cur) => acc + cur.quantity * cur.price,
            0
          ) - sale.billTotal
        ).toFixed(2),
        "Grand Total": sale.billTotal.toFixed(2),
        "Purchase Date": sale.createdOn.toDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ["Total Discount", totalDiscount.toFixed(2)],
          ["Total Sales", totalSales.toFixed(2)],
          ["Total Sales Count", totalSalesCount],
        ],
        { origin: -1 }
      );

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      res.writeHead(200, {
        "Content-Disposition": 'attachment;filename="sales_report.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      res.end(buffer);
    } else {
      res.status(400).send("Invalid format requested");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  loadSalesReport,
  downloadReport,
};
