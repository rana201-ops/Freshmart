const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ uploads folder path (same as server.js static)
const uploadDir = path.join(__dirname, "..", "uploads");

// ✅ create folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/pdf", // ✅ add this
  ];

  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only jpg/png/webp/pdf allowed"), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
