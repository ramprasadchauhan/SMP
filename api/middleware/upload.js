import multer from "multer";
import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES } from "../constants/index.js";
import { AppError, badRequest } from "../utils/AppError.js";

// Files are held in memory (max 5 MB) and streamed to Cloudinary; nothing is
// written to the server's disk.
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    IMAGE_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(badRequest("Only JPEG, PNG, WebP or GIF images are allowed", { code: "INVALID_FILE_TYPE" })),
}).single("file");

export const imageUpload = (req, res, next) =>
  parser(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(
        err.code === "LIMIT_FILE_SIZE"
          ? new AppError(413, "Images must be 5 MB or smaller")
          : badRequest(err.message)
      );
    }
    if (err) return next(err);
    if (!req.file) return next(badRequest("Choose an image file to upload", { code: "FILE_REQUIRED" }));
    next();
  });
