import express from "express";
import cors from "cors";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { runAgentController } from "../features/agent/agent.controller.js";
import { extractResumeController, submitApplicantProfileController } from "../features/applicant/resume.controller.js";
import { resumeUpload } from "../features/applicant/resume-upload.js";
import { requireRecruiter } from "../middleware/requireRecruiter.js";

const app = express();

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

const extractionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 4,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many resume uploads. Please wait 15 minutes and try again." },
});
const submissionLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many profile submissions. Please try again later." },
});

app.post("/applicant/extract", extractionLimit, resumeUpload, extractResumeController);
app.post("/applicant/submit", submissionLimit, submitApplicantProfileController);
app.post("/run-agent", requireRecruiter, runAgentController);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "The resume must be 8 MB or smaller."
      : "The resume could not be uploaded. Try one file at a time.";
    return res.status(400).json({ success: false, message });
  }
  return res.status(error.status || 500).json({
    success: false,
    message: error.status === 415 ? error.message : "The request could not be processed.",
  });
});

export default app;

