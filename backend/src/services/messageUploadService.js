const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const cloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const safeExtension = (file) => {
  const byMime = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
  };
  return byMime[file.mimetype] || "";
};

const uploadToCloudinary = (file, publicId) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const isImage = file.mimetype.startsWith("image/");
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "smart-community/messages",
        public_id: publicId,
        resource_type: isImage ? "image" : "raw",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, provider: "cloudinary" });
      },
    );
    stream.end(file.buffer);
  });
};

const uploadLocally = async (file, publicId) => {
  const relativeDirectory = path.join("uploads", "messages");
  const absoluteDirectory = path.join(__dirname, "..", "..", relativeDirectory);
  await fs.mkdir(absoluteDirectory, { recursive: true });

  const fileName = `${publicId}-${crypto.randomBytes(5).toString("hex")}${safeExtension(file)}`;
  await fs.writeFile(path.join(absoluteDirectory, fileName), file.buffer);
  const publicBaseUrl = (process.env.API_PUBLIC_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  const relativeUrl = `${relativeDirectory.replace(/\\/g, "/")}/${fileName}`;
  return { url: `${publicBaseUrl}/${relativeUrl}`, provider: "local" };
};

const uploadMessageFile = (file, userId) => {
  const publicId = `message-${userId}-${Date.now()}`;
  if (cloudinaryConfigured()) return uploadToCloudinary(file, publicId);
  return uploadLocally(file, publicId);
};

module.exports = { uploadMessageFile };
