import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  readProduct,
  readSpecificProduct,
  updateProductController,
} from "../controller/productController.js";
import upload from "../utils/upload.js";

const productRouter = Router();
//    "/""=localhost:8000 / products;

// upload.single("image") reads an optional file from the "image" form field
productRouter.route("/").post(upload.single("image"), createProduct).get(readProduct);

//    "/""=localhost:8000/products/:id;
productRouter
  .route("/:id")
  .get(readSpecificProduct)
  .patch(upload.single("image"), updateProductController)
  .delete(deleteProduct);

//update
//id -req.params.id
// data -req.body

export default productRouter;
