const Product = require("../models/Product");

class ProducRepo {
  async getAllProducts(searchPhrase = "") {
    let filterObj = {};
    if (searchPhrase) {
      filterObj = {
        $or: [
          { name: { $regex: searchPhrase, $options: "i" } },
          { code: { $regex: searchPhrase, $options: "i" } },
        ],
      };
    }
    try {
      const products = await Product.find(filterObj).sort({ name: 1 });
      return products;
    } catch (err) {
      console.log(`Error fetching products:${err.message}`);
      return false;
    }
  }

  async createProduct(newProduct) {
    try {
      const newProductDoc = await Product.create(newProduct); // Use 'create' instead of 'Create'
      await newProductDoc.save();
      return `${newProduct.name} added successfully!`;
    } catch (err) {
      console.log(`Error while adding ${newProduct.name}: ${err.message}`);
      return `Error while adding ${newProduct.name}: Please ensure unique name and code!`;
    }
  }

  async getProductByName(name) {
    try {
      const product = await Product.findOne({ name: name });
      return product;
    } catch (err) {
      console.log(`Error finding/fetching product ${name}: ${err.message}`);
      return false;
    }
  }

  async editProduct(name, editedProduct) {
    try {
      // find product by this name
      const productDoc = await Product.findOne({ name: name });
      if (!productDoc) {
        return `Error while fetching or finding ${name}`;
      }
      // update product
      await Object.assign(productDoc, editedProduct);
      // saving product doc
      console.log(`saving updated doc for ${name}`);
      await productDoc.save();
      return `${editedProduct.name} edited successfully!`;
    } catch (err) {
      console.log(`Error editing product ${name}: ${err.message}`);
      return `Error editing product ${name}`;
    }
  }

  async deleteProduct(name) {
    try {
      const deletedDoc = await Product.findOneAndDelete({ name: name });
      return deletedDoc;
    } catch (err) {
      console.log(`Error deleting product ${name}: ${err.message}`);
      return false;
    }
  }
}

module.exports = ProducRepo;
