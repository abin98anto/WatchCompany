const Coupon = require("../models/couponModel");

// Load Coupon management.
const loadCouponManangement = async (req, res) => {
  try {
    const coupons = await Coupon.find();
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

// List/ Unlist coupons.
const updateCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.query;
    const { isUnlisted } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    coupon.isUnlisted = isUnlisted;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${isUnlisted ? "unlisted" : "listed"} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update coupon status",
      error: error.message,
    });
  }
};

// Delete coupons.
const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    if (!deletedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update coupon.
const updateCoupon = async (req, res) => {
  try {
    const {
      couponId,
      couponCode,
      startDate,
      endDate,
      minPurchase,
      discountPercentage,
      maxDiscount,
    } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      {
        couponCode: couponCode,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minPurchase: minPurchase,
        discountPercentage: discountPercentage,
        maxDiscount: maxDiscount,
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the coupon",
    });
  }
};

module.exports = {
  loadCouponManangement,
  addCoupon,
  duplicateCheck,
  getCoupons,
  updateCouponStatus,
  deleteCoupon,
  updateCoupon,
};
