const express = require("express");
const productsRouter = express.Router();
const {GetAllProducts,CreateProductForm,CreateProduct,ProductDetails,DeleteProduct,EditProductForm,EditProduct} = require("../controllers/ProductsController");

// Define CRUD routes
productsRouter.get("/",GetAllProducts);
productsRouter.get("/create",CreateProductForm);
productsRouter.post("/create",CreateProduct);
productsRouter.get("/:productName/delete",DeleteProduct)
productsRouter.get("/:productName/edit",EditProductForm)
productsRouter.post("/:productName/edit",EditProduct)
productsRouter.get("/:productName",ProductDetails);

module.exports = productsRouter;
