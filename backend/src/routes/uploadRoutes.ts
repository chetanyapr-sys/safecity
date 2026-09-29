import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP images or MP4, WEBM videos are allowed"));
    }
  },
});

router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");

    const uploadFromBuffer = (): Promise<{ url: string; type: string }> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "safecity-incidents",
            resource_type: isVideo ? "video" : "image",
          },
          (error, result) => {
            if (error || !result) {
              return reject(error);
            }
            resolve({
              url: result.secure_url,
              type: isVideo ? "video" : "image",
            });
          }
        );
        stream.end(req.file!.buffer);
      });
    };

    const result = await uploadFromBuffer();

    res.status(200).json({ mediaUrl: result.url, mediaType: result.type });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Upload failed" });
  }
});

export default router;