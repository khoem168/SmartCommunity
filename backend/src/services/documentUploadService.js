const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const { assertValidFileSignature } = require("../utils/fileSignature");

const cloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const uploadToCloudinary = (file, folder, publicId) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `smart-community/${folder}`,
        public_id: publicId,
        resource_type: "raw",
        format: "pdf",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, provider: "cloudinary" });
      },
    );
    stream.end(file.buffer);
  });
};

const uploadLocally = async (file, folder, publicId) => {
  const relativeDirectory = path.join("uploads", folder);
  const absoluteDirectory = path.join(__dirname, "..", "..", relativeDirectory);
  await fs.mkdir(absoluteDirectory, { recursive: true });
  const fileName = `${publicId}-${crypto.randomBytes(5).toString("hex")}.pdf`;
  await fs.writeFile(path.join(absoluteDirectory, fileName), file.buffer);
  const baseUrl = (
    process.env.API_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
  const relativeUrl = `${relativeDirectory.replace(/\\/g, "/")}/${fileName}`;
  return { url: `${baseUrl}/${relativeUrl}`, provider: "local" };
};

const uploadDocument = (file, { folder, publicId }) => {
  assertValidFileSignature(file, "Only valid PDF files are allowed for CV uploads.");
  return cloudinaryConfigured()
    ? uploadToCloudinary(file, folder, publicId)
    : uploadLocally(file, folder, publicId);
};

module.exports = { uploadDocument };
