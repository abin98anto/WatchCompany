const bcrypt = require("bcrypt");
const moment = require("moment");

// Load Controllers.
const User = require("../models/userModel");
const Products = require("../models/productModel");
const Categories = require("../models/categoryModel");
const Orders = require("../models/orderModel");

// Render Admin Login.
const loadAdminLogin = async (req, res) => {
  try {
    res.render("admin_login", { message: "" });
  } catch (error) {
    res.send(`Error Loading Admin Login Page.`);
  }
};

// Verifying Admin Credentials.
const verifyAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const message = "Username or password is incorrect.";
    const adminFound = await User.findOne({ email, isAdmin: 1 });
    if (!adminFound) {
      res.render("admin_login", { message: message });
    } else {
      const passwordMatch = await bcrypt.compare(password, adminFound.password);
      if (passwordMatch) {
        req.session.adminData = adminFound;
        res.redirect("/admin/dashboard");
      } else {
        res.render("admin_login", { message: message });
      }
    }
  } catch (error) {
    res.send(`Error Verifying Admin Login`);
  }
};

// Rendering Admin Dashboard.
const loadDashboard = async (req, res) => {
  try {
    const products = await Products.find({ isUnlisted: false });
    const categories = await Categories.find({ isUnlisted: false });
    const orders = await Orders.find({ orderStatus: "Delivered" });

    // Total Revenue calculation.
    let revenue = orders.reduce((acc, cur) => {
      acc += cur.billTotal;
      return acc;
    }, 0);

    // Monthly revenue calculation.
    const currentMonth = moment().month();
    const currentYear = moment().year();

    const monthlyOrders = orders.filter((order) => {
      const orderDate = moment(order.createdOn);
      return (
        orderDate.month() === currentMonth && orderDate.year() === currentYear
      );
    });

    const monthlyRevenue = monthlyOrders.reduce((acc, cur) => {
      acc += cur.billTotal;
      return acc;
    }, 0);

    // Top 10 products
    const productSales = {};

    orders.forEach((order) => {
      order.products.forEach((product) => {
        if (productSales[product.productId]) {
          productSales[product.productId].quantity += product.quantity;
        } else {
          productSales[product.productId] = {
            quantity: product.quantity,
            media: product.media,
            name: product.productName,
          };
        }
      });
    });

    const topProducts = Object.keys(productSales)
      .map((productId) => ({
        productId,
        ...productSales[productId],
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topProductDetails = await Products.find({
      _id: { $in: topProducts.map((product) => product.productId) },
    });

    const topSellingProducts = topProducts.map((product) => {
      const productDetail = topProductDetails.find(
        (p) => p._id.toString() === product.productId
      );
      return {
        ...product,
        media: productDetail.media,
        name: productDetail.name,
      };
    });

    // Top Selling Categories
    const categorySales = {};

    orders.forEach((order) => {
      order.products.forEach((product) => {
        const productDetail = products.find(
          (p) => p._id.toString() === product.productId
        );
        if (productDetail && categorySales[productDetail.category]) {
          categorySales[productDetail.category] += product.quantity;
        } else if (productDetail) {
          categorySales[productDetail.category] = product.quantity;
        }
      });
    });

    const topCategories = Object.keys(categorySales)
      .map((categoryId) => ({
        categoryId,
        quantity: categorySales[categoryId],
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topCategoryDetails = await Categories.find({
      name: { $in: topCategories.map((category) => category.categoryId) },
    });

    const topSellingCategories = topCategories.map((category) => {
      const categoryDetail = topCategoryDetails.find(
        (c) => c.name === category.categoryId
      );
      return {
        ...category,
        name: categoryDetail.name,
      };
    });

    // Sales Chart
    const salesData = await aggregateSalesData();

    const dailySalesData = processDailySalesData(salesData);
    const weeklySalesData = processWeeklySalesData(salesData);
    const monthlySalesData = processMonthlySalesData(salesData);
    const yearlySalesData = processYearlySalesData(salesData);

    res.render("dashboard", {
      products,
      categories,
      orders,
      revenue,
      monthlyRevenue,
      topSellingProducts,
      topSellingCategories,
      weeklySalesData,
      monthlySalesData,
      yearlySalesData,
      dailySalesData,
    });
  } catch (error) {
    console.log(`Error Loading Admin Dashboard. : ${error}`);
  }
};

async function aggregateSalesData() {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const salesData = await Orders.aggregate([
    {
      $match: {
        createdOn: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdOn" },
          month: { $month: "$createdOn" },
          week: { $week: "$createdOn" },
          day: { $dayOfMonth: "$createdOn" },
        },
        totalSales: { $sum: "$billTotal" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 },
    },
  ]);

  return salesData;
}

// Process daily sales data
function processDailySalesData(salesData) {
  let dailyData = {};

  salesData.forEach((item) => {
    const date = `${item._id.year}-${item._id.month}-${item._id.day}`;

    if (!dailyData[date]) {
      dailyData[date] = 0;
    }
    dailyData[date] += item.totalSales;
  });

  const labels = Object.keys(dailyData);
  const data = Object.values(dailyData);

  return { labels, data };
}

// Process weekly sales data
function processWeeklySalesData(salesData) {
  let weeklyData = {};

  salesData.forEach((item) => {
    const week = moment(
      item._id.year + "-" + item._id.month + "-" + item._id.day,
      "YYYY-MM-DD"
    ).isoWeek();
    const year = item._id.year;
    const weekYear = `${year}-W${week}`;

    if (!weeklyData[weekYear]) {
      weeklyData[weekYear] = 0;
    }
    weeklyData[weekYear] += item.totalSales;
  });

  const labels = Object.keys(weeklyData);
  const data = Object.values(weeklyData);

  return { labels, data };
}

// Process monthly sales data
function processMonthlySalesData(salesData) {
  let monthlyData = {};

  salesData.forEach((item) => {
    const monthYear = `${item._id.year}-${item._id.month}`;

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = 0;
    }
    monthlyData[monthYear] += item.totalSales;
  });

  const labels = Object.keys(monthlyData);
  const data = Object.values(monthlyData);

  return { labels, data };
}

// Process yearly sales data
function processYearlySalesData(salesData) {
  let yearlyData = {};

  salesData.forEach((item) => {
    const year = item._id.year;

    if (!yearlyData[year]) {
      yearlyData[year] = 0;
    }
    yearlyData[year] += item.totalSales;
  });

  const labels = Object.keys(yearlyData);
  const data = Object.values(yearlyData);

  return { labels, data };
}

// Logging Out Admin (not for google login).
const logout = async (req, res) => {
  try {
    req.session.adminData = null;
    res.redirect("/admin/");
  } catch (error) {
    res.send("Error Logging Out Admin.");
  }
};

module.exports = {
  loadAdminLogin,
  verifyAdmin,
  loadDashboard,
  logout,
};
