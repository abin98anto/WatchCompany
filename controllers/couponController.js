const Coupon = require("../models/couponModel");

// Load Coupon management.
const loadCouponManangement = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isUnlisted: false });
    res.render("coupon_management", { coupons });
  } catch (error) {
    console.log(`error rendering the coupon management page : ${error}`);
  }
};

// Create Coupon.
const addCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      startDate,
      endDate,
      minPurchase,
      discountPercentage,
      maxDiscount,
    } = req.body;

    const newCoupon = new Coupon({
      couponCode,
      startDate,
      endDate,
      minPurchase,
      discountPercentage,
      maxDiscount,
      usedList: [],
      createdOn: Date.now(),
    });

    await newCoupon.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
};

// Check for duplicate coupon codes.
const duplicateCheck = async (req, res) => {
  const { couponCode } = req.body;
  try {
    const existingCoupon = await Coupon.findOne({ couponCode: couponCode });
    if (existingCoupon) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get coupons.
const getCoupons = async (req, res) => {
  try {
    const { couponId } = req.query;
    const coupon = await Coupon.findById(couponId);
    res.json(coupon);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  loadCouponManangement,
  addCoupon,
  duplicateCheck,
  getCoupons,
};
