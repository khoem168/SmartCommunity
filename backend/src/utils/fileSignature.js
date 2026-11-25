/**
 * Magic-byte file signature verification to prevent MIME-type spoofing
 * (e.g., uploading an HTML/JS or executable file disguised as a JPG or PDF).
 */

const startsWithBytes = (buffer, bytes, offset = 0) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < offset + bytes.length) {
    return false;
  }
  for (let i = 0; i < bytes.length; i += 1) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
};

const verifyFileSignature = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return false;
  }

  switch (mimetype) {
    case "image/jpeg":
      // JPEG magic bytes: FF D8 FF
      return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);

    case "image/png":
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    case "image/webp":
      // WebP magic bytes: "RIFF" at 0..3 and "WEBP" at 8..11
      return (
        startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46], 0) &&
        startsWithBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)
      );

    case "application/pdf":
      // PDF magic bytes: "%PDF-" (25 50 44 46 2D)
      return startsWithBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d]);

    case "application/msword":
      // Legacy DOC (OLE Compound File): D0 CF 11 E0 A1 B1 1A E1
      return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      // DOCX (ZIP container): 50 4B 03 04
      return startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]);

    case "text/plain": {
      // Reject binary files with null bytes or active HTML/script payloads
      const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
      if (sample.includes(0x00)) return false;
      const text = sample.toString("utf8");
      if (/<\s*(script|iframe|object|embed|svg|html|body)\b/i.test(text)) {
        return false;
      }
      return true;
    }

    default:
      return false;
  }
};

const assertValidFileSignature = (file, customErrorMessage) => {
  if (!file || !verifyFileSignature(file.buffer, file.mimetype)) {
    throw new Error(
      customErrorMessage ||
        "Uploaded file content does not match its declared file type.",
    );
  }
};

module.exports = {
  assertValidFileSignature,
  verifyFileSignature,
};
