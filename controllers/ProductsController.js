const ProducRepo = require("../repos/productRepo");
const verifyAuth = require("../services/verifyAuth");

const _productRepo = new ProducRepo();

exports.GetAllProducts = async (req, res, next) => {
  const rolesPermitted = ["user", "admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // check if there is any search phrase
      const searchPhrase = req.query.query ? req.query.query : "";
      // get products list
      const products = await _productRepo.getAllProducts(searchPhrase);
      // check if we get anything
      if (products) {
        return res.render("secure/users/listProducts", {
          title: "Express Billing Project: Products",
          authInfo: authInfo,
          products: products,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
          isSearch: searchPhrase ? true : false,
        });
      } else {
        return res.render("secure/users/listProducts", {
          title: "Express Billing Project: Products",
          authInfo: authInfo,
          products: [],
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
            isSearch: false,
        });
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

exports.ProductDetails = async (req, res, next) => {
  const rolesPermitted = ["user", "admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      let errorMessage = req.flash("error")[0];
      let successMessage = req.flash("success")[0];
      // get product name and details
      const productName = req.params.productName;
      const product = await _productRepo.getProductByName(productName);
      // check if we get anything
      if (product) {
        return res.render("secure/users/productDetails", {
          title: `Express Billing Project: Product ${productName}`,
          authInfo: authInfo,
          product: product,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      } else {
        req.flash("error", `Could not find/fetch ${productName}'s details`);
        return res.status(500).redirect("/products");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

exports.CreateProductForm = (req, res, next) => {
  const rolesPermitted = ["admin"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // render form
      return res.render("secure/admins/productCreateEdit", {
        title: "Express Billing Project: Product Create",
        purpose: "create",
        authInfo: authInfo,
        product: {},
        message: errorMessage
          ? { error: errorMessage }
          : successMessage
          ? { success: successMessage }
          : {},
      });
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

exports.CreateProduct = async (req, res, next) => {
  const rolesPermitted = ["admin"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      let errorMessage = req.flash("error")[0];
      let successMessage = req.flash("success")[0];
      // get product details from req.body
      const newProduct = {
        name: req.body.name,
        code: req.body.code,
        unitCost: parseFloat(req.body.unitCost),
      };
      // Check if the parsed price is a valid number
      if (isNaN(req.body.unitCost)) {
        errorMessage = "UnitCost needs to be decimal!";
        return res.status(400).render("secure/admins/productCreateEdit", {
          title: "Express Billing Project: Product Create",
          purpose: "create",
          authInfo: authInfo,
          product: newProduct,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      }
      // send to repo to add to database
      const response = await _productRepo.createProduct(newProduct);
      // if response includes Error
      if (response.includes("Error")) {
        errorMessage = response;
        return res.status(400).render("secure/admins/productCreateEdit", {
          title: "Express Billing Project: Product Create",
          purpose: "create",
          authInfo: authInfo,
          product: newProduct,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      } else {
        req.flash("success", response);
        return res.status(200).redirect("/products");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

exports.EditProductForm = async (req, res, next) => {
  const rolesPermitted = ["admin"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      let errorMessage = req.flash("error")[0];
      let successMessage = req.flash("success")[0];
      // get product name and details
      const productName = req.params.productName;
      const product = await _productRepo.getProductByName(productName);
      // if no product by this name
      if (!product) {
        req.flash("error", `Unable to find/fetch ${productName}!`);
        return res.status(500).redirect("/products");
      }
      // else render form
      return res.render("secure/admins/productCreateEdit", {
        title: `Express Billing Project: Product ${productName} Edit`,
        purpose: "edit",
        authInfo: authInfo,
        product: product,
        message: {},
      });
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

exports.EditProduct = async (req, res, next) => {
  const rolesPermitted = ["admin"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      let errorMessage = req.flash("error")[0];
      let successMessage = req.flash("success")[0];
      // get product name
      const productName = req.params.productName;
      // create an editedProduct object
      const editedProduct = {
        name: req.body.name,
        code: req.body.code,
        unitCost: parseFloat(req.body.unitCost),
      };
      if (isNaN(req.body.unitCost)) {
        // render form again
        return res.status(500).render("secure/admin/productCreateEdit", {
          title: `Express Billing Project: Product ${productName} Edit`,
          purpose: "edit",
          authInfo: authInfo,
          product: editedProduct,
          message: { error: "UnitCost needs to be decimal!" },
        });
      } else {
        // send to repo for update
        const response = await _productRepo.editProduct(
          productName,
          editedProduct
        );
        // if response includes error
        if (response.includes("Error")) {
          // redirect to products page with an error message
          req.flash("error", response);
          return res.status(500).redirect("/products");
        } else {
          // redirect to product's page with a success message
          req.flash("success", response);
          return res.status(500).redirect(`/products/${editedProduct.name}`);
        }
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

exports.DeleteProduct = async (req, res, next) => {
  const rolesPermitted = ["admin"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated

  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      let errorMessage = req.flash("error")[0];
      let successMessage = req.flash("success")[0];
      // get product name and delete
      const productName = req.params.productName;
      const deletedProduct = await _productRepo.deleteProduct(productName);
      if (deletedProduct) {
        req.flash(
          "success",
          `Product ${deletedProduct.name} deleted successfully!`
        );
        return res.status(200).redirect("/products");
      } else {
        req.flash("error", `Unable to find/fetch/delete ${productName}!`);
        return res.status(500).redirect("/products");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};
