// make express app
// attach port to it

import express, { json } from "express";
import connectToDb from "./src/connectToDb/connectToDb.js";
import productRouter from "./src/routes/productRouter.js";
import cors from "cors";
import { uploadDir } from "./src/utils/upload.js";

import dns from "node:dns";

// Load Backend/.env (e.g. MONGODB_URI) using Node's built-in loader; skip if the file is missing
try {
  process.loadEnvFile(new URL("./.env", import.meta.url));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}


let app = express();
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// The backend listens on 8000. On the server, Nginx (port 80) sends /product and /uploads here
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
