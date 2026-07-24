const multer = require("multer");

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Only PDF files are allowed for CV uploads."));
    }
    return callback(null, true);
  },
});

module.exports = documentUpload;
