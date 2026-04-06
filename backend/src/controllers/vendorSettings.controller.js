const VendorSettings = require("../models/VendorSettings");
const User = require("../models/User");

exports.getMySettings = async (req, res) => {
  try {
    const settings = await VendorSettings.findOne({ vendor: req.user._id }).lean();
    return res.json(settings || null);
  } catch (err) {
    console.log("GET SETTINGS ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

const isValidPan = (pan) =>
  !pan ? true : /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(String(pan).trim());

const isValidIfsc = (ifsc) =>
  /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(ifsc || "").trim());

exports.saveMySettings = async (req, res) => {
  try {
    console.log("✅ HIT saveMySettings:", req.user?.email);

    const {
      shopName,
      phone,
      address,
      city,
      pincode,
      panNo,
      gstNo,
      bankHolderName,
      bankAccountNo,
      ifsc,
      submitForApproval,
    } = req.body;

    // ✅ IMPORTANT: FormData se "true"/"false" string aata hai
    const submitFlag = String(submitForApproval) === "true";

    if (!shopName || !phone || !address) {
      return res.status(400).json({ msg: "Shop name, phone and address are required" });
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(String(shopName).trim())) {
      return res.status(400).json({ msg: "Shop name should contain only letters/numbers" });
    }

    if (!/^[0-9]{10}$/.test(String(phone).trim())) {
      return res.status(400).json({ msg: "Phone number must be exactly 10 digits" });
    }

    if (!isValidPan(panNo)) {
      return res.status(400).json({ msg: "Invalid PAN format (example: ABCDE1234F)" });
    }

    if (submitFlag) {
      if (!String(city || "").trim() || !String(pincode || "").trim()) {
        return res.status(400).json({ msg: "City and Pincode are required to submit for approval" });
      }

      if (!/^[0-9]{6}$/.test(String(pincode).trim())) {
        return res.status(400).json({ msg: "Pincode must be 6 digits" });
      }

      if (!String(bankHolderName || "").trim() || !String(bankAccountNo || "").trim() || !String(ifsc || "").trim()) {
        return res.status(400).json({ msg: "Bank details are required to submit for approval" });
      }

      if (!isValidIfsc(ifsc)) {
        return res.status(400).json({ msg: "Invalid IFSC code (example: HDFC0001234)" });
      }
    }

    const nextStatus = submitFlag ? "pending_review" : "draft";

    // ✅ files
    const files = req.files || {};
    const getPath = (key) => {
      const f = files?.[key]?.[0];
      return f ? `/uploads/${f.filename}` : "";
    };

    const shopPhotoPath = getPath("shopPhoto");
    const gstDocPath = getPath("gstDoc");
    const panDocPath = getPath("panDoc");

    const setObj = {
      shopName: String(shopName).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      city: String(city || "").trim(),
      pincode: String(pincode || "").trim(),
      panNo: String(panNo || "").trim().toUpperCase(),
      gstNo: String(gstNo || "").trim().toUpperCase(),
      bankHolderName: String(bankHolderName || "").trim(),
      bankAccountNo: String(bankAccountNo || "").trim(),
      ifsc: String(ifsc || "").trim().toUpperCase(),
      status: nextStatus,
    };

    if (shopPhotoPath) setObj.shopPhoto = shopPhotoPath;
    if (gstDocPath) setObj.gstDoc = gstDocPath;
    if (panDocPath) setObj.panDoc = panDocPath;

    if (submitFlag) {
      setObj.submittedAt = new Date();
      setObj.adminRemark = "";
    }

    const settings = await VendorSettings.findOneAndUpdate(
      { vendor: req.user._id },
      { $set: setObj },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user._id, {
      $set: { vendorStatus: nextStatus },
    });

    return res.json({
      msg: submitFlag
        ? "✅ Submitted for approval. Waiting for admin review."
        : "✅ Saved as draft. You can submit for approval anytime.",
      settings,
    });
  } catch (err) {
    console.log("❌ saveMySettings ERROR:", err);
    return res.status(500).json({ msg: err.message || "Server error" });
  }
};