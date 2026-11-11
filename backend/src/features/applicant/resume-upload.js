import multer from "multer";
import path from "node:path";

const allowedTypes = new Set([".pdf", ".docx", ".txt"]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (!allowedTypes.has(extension)) {
      const error = new Error("Only PDF, DOCX, and TXT resumes are supported.");
      error.status = 415;
      return callback(error);
    }
    return callback(null, true);
  },
}).single("resume");
