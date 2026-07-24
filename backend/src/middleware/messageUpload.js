const multer = require("multer");

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const messageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(
        new Error("Chat files must be JPG, PNG, WebP, PDF, TXT, DOC, or DOCX."),
      );
    }
    return callback(null, true);
  },
});

module.exports = messageUpload;
