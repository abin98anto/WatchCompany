const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Multer Configuring.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage }).array("media", 10);

// Render product management page.
const loadProductManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 5;

    const Products = await Product.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdOn: -1 });
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / pageSize);

    const Categories = await Category.find({ isUnlisted: false });

    res.render("product_management", {
      products: Products,
      categories: Categories,
      currentPage: page,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    console.error(`Error rendering product management page: ${error}`);
    res.status(500).send(`Error rendering product management page`);
  }
};

// Render add new product page.
const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({ isUnlisted: false });
    res.render("add_new_product", { categories: categories });
  } catch (error) {
    console.log(`Error Rendering Add New Product Page.`);
  }
};

// Adding the product to database.
const addProduct = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        console.log(`Multer error: ${err}`);
        res.status(500).send("Error Uploading the images");
        return;
      } else if (err) {
        console.log(`Unknown Error: ${err}`);
        res.status(500).send("Unknown Error Occurred. The Error: ", err);
        return;
      }
      if (!req.files || req.files.length === 0) {
        res.status(400).send(`No images uploaded.`);
        return;
      }

      try {
        const processedImages = [];
        for (const file of req.files) {
          const filename = `${file.originalname} - cropped`;
          const imagePath = path.join(
            __dirname,
            "..",
            "public",
            "uploads",
            filename
          );

          try {
            const imageBuffer = await sharp(file.path)
              .resize(440, 440)
              .toBuffer();

            fs.writeFileSync(imagePath, imageBuffer);

            fs.unlinkSync(file.path);

            processedImages.push(filename);
          } catch (error) {
            console.log(`Error occurred while processing the image: ${error}`);
            res.status(500).send("Error processing the image");
            return;
          }
        }

        const { name, description, price, category, stock, media } = req.body;
        const newProduct = new Product({
          name,
          description,
          price,
          category,
          stock,
          media: processedImages,
          createdOn: new Date(),
        });

        await newProduct.save();
        res.redirect("/admin/product_management");
      } catch (err) {
        console.log(
          `Error occurred while processing the image using Sharp: ${err}`
        );
        res
          .status(500)
          .send(`Error processing images using Sharp ${err.message}`);
      }
    });
  } catch (err) {
    console.log(`error adding product : ${err}`);
    res.status(500).send(`Error adding Product.`);
  }
};

// List/ Unlist Products.
const toggleProductStatus = async (req, res) => {
  try {
    let id = req.query.id;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).send("Product not found");
      return;
    }
    product.isUnlisted = !product.isUnlisted;
    await product.save();
    res.redirect("/admin/product_management");
  } catch (error) {
    console.log(`Error Toggling Product Status.`);
  }
};

// load edit product.
const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const Categories = await Category.find({ isUnlisted: false });
    const product = await Product.findById(id);
    res.render("edit_product", { product: product, categories: Categories });
  } catch (error) {
    console.log(`Error loading Edit Products`);
  }
};

// Edit product.
const editProduct = async (req, res) => {
  try {
    const { id } = req.query;

    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        console.log(`Multer error: ${err}`);
        res.status(500).send("Error Uploading the images");
        return;
      } else if (err) {
        console.log(`Unknown Error: ${err}`);
        res.status(500).send("Unknown Error Occurred. The Error: ", err);
        return;
      }

      try {
        const processedImages = [];
        for (const file of req.files) {
          const filename = `${file.originalname} - cropped`;
          const imagePath = path.join(
            __dirname,
            "..",
            "public",
            "uploads",
            filename
          );

          try {
            const imageBuffer = await sharp(file.path)
              .resize(440, 440)
              .toBuffer();

            fs.writeFileSync(imagePath, imageBuffer);

            fs.unlinkSync(file.path);

            processedImages.push(filename);
          } catch (error) {
            console.log(`Error occurred while processing the image: ${error}`);
            res.status(500).send("Error processing the image");
            return; // Stop further execution
          }
        }

        const { name, description, price, category, stock, media } = req.body;
        const updateProduct = await Product.findByIdAndUpdate(id, {
          $push: { media: { $each: processedImages } },
          name: name,
          description: description,
          price: price,
          category: category,
          stock: stock,
        });

        await updateProduct.save();
        res.redirect("/admin/product_management");
      } catch (err) {
        console.log(
          `Error occurred while processing the image using Sharp: ${err}`
        );
        res
          .status(500)
          .send(`Error processing images using Sharp ${err.message}`);
      }
    });
  } catch (err) {
    console.log(`error editing product : ${err}`);
    res.status(500).send(`Error editing Product.`);
  }
};

// delete single images in edit product
const deleteImage = async (req, res) => {
  try {
    const { productId, index } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.media.splice(index, 1);
    await product.save();
    res.redirect(`/admin/edit_product?id=${productId}`);
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
};

//  get products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isUnlisted: false });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error searching users" });
  }
};

// Check Stock
const checkStock = async (req, res) => {
  try {
    const { productId, quantity } = req.query;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const available = product.quantity >= parseInt(quantity);
    res.json({
      available: available,
      productName: product.name,
      stock: product.stock,
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  loadProductManagement,
  loadAddProduct,
  addProduct,
  toggleProductStatus,
  loadEditProduct,
  editProduct,
  deleteImage,
  getProducts,
  checkStock,
};
