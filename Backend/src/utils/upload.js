import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

// Images are saved to Backend/uploads and served at /uploads/<filename>
export const uploadDir = fileURLToPath(new URL("../../uploads", import.meta.url));
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Delete a previously uploaded image, e.g. "/uploads/123.jpg"
export const removeImage = (imagePath) => {
  if (!imagePath) return;
  fs.unlink(path.join(uploadDir, path.basename(imagePath)), () => {});
};

export default upload;
