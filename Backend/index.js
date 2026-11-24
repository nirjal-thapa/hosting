// make express app
// attach port to it

import express, { json } from "express";
import connectToDb from "./src/connectToDb/connectToDb.js";
import productRouter from "./src/routes/productRouter.js";
import cors from "cors";
import { uploadDir } from "./src/utils/upload.js";

import dns from "node:dns";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Load Backend/.env (e.g. MONGODB_URI) using Node's built-in loader; skip if the file is missing
try {
  process.loadEnvFile(new URL("./.env", import.meta.url));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}


let app = express();
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// On the AWS server PORT is set to 80 (see deploy/inventory.service); locally it stays 8000
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`<---- Apllication is listening at ${port} ---->`);
  connectToDb();
});
// npm i cors
app.use(cors());
app.use(json()); //make our system capable to take json data , always place it at top
app.use("/uploads", express.static(uploadDir)); // serve product pictures
app.use("/product", productRouter);

// Serve the built React website (frontend/dist, made by "npm run build").
// Any other page address (e.g. /read, /create) gets index.html so React Router can show the right page.
const websiteDir = fileURLToPath(new URL("../frontend/dist", import.meta.url));
if (existsSync(websiteDir)) {
  app.use(express.static(websiteDir));
  app.get("/{*page}", (req, res) => res.sendFile("index.html", { root: websiteDir }));
}

// Return upload/validation errors as JSON instead of an HTML page
app.use((err, req, res, next) => {
  const status = err.name === "MulterError" || err.message === "Only image files are allowed" ? 400 : 500;
  res.status(status).json({ success: false, message: err.message });
});
// app.get("/tests", test);

/* 
Schema -data structure define
model
router
index - define router to express app

*/
