import expressAsyncHandler from "express-async-handler";
import { Product } from "../schema/model.js";
import { removeImage } from "../utils/upload.js";

export const createProduct = expressAsyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = `/uploads/${req.file.filename}`;
  const result = await Product.create(data);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    result: result,
  });
});

export const readProduct = expressAsyncHandler(async (req, res) => {
  const result = await Product.find();
  res.status(200).json({
    success: true,
    message: "Product read successfully",
    result: result,
  });
});

export const readSpecificProduct = expressAsyncHandler(async (req, res) => {
  const result = await Product.findById(req.params.id);
  res.status(200).json({
    success: true,
    message: "Product read successfully",
    result: result,
  });
});

export const updateProductController = expressAsyncHandler(async (req, res) => {
  const { removeImage: shouldRemoveImage, ...data } = req.body;
  const existing = await Product.findById(req.params.id);

  if (req.file) {
    // New picture uploaded: store it and delete the old file
    data.image = `/uploads/${req.file.filename}`;
    removeImage(existing?.image);
  } else if (shouldRemoveImage === "true") {
    // Picture removed without a replacement
    data.$unset = { image: "" };
    removeImage(existing?.image);
  }

  const result = await Product.findByIdAndUpdate(req.params.id, data, {
    new: true,
  });
  res.status(201).json({
    success: true,
    message: "Product Updated sucessfully",
    result: result,
  });
});

export const deleteProduct = expressAsyncHandler(async (req, res) => {
  const result = await Product.findByIdAndDelete(req.params.id);
  removeImage(result?.image);
  res.status(200).json({
    success: true,
    message: "Prodcut deleted successfully",
    result: result,
  });
});
