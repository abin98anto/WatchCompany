const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { stopCoverage } = require("v8");

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
      .limit(pageSize);
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
    // console.log(`Rendering Add New Product Page.`);
    const categories = await Category.find({ isUnlisted: false });
    res.render("add_new_product", { categories: categories });
  } catch (error) {
    console.log(`Error Rendering Add New Product Page.`);
  }
};

// Adding the product to database.
const addProduct = async (req, res) => {
  try {
    // console.log(`Adding New Product to DB.`);
    console.log(req.body);

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

          // Check if the file exists before processing
          // if (!fs.existsSync(file.path)) {
          //   console.log(`Input file is missing: ${file.path}`);
          //   res.status(400).send("Input file is missing");
          //   return;
          // }

          try {
            // Process the image using Sharp
            const imageBuffer = await sharp(file.path)
              .resize(440, 440)
              .toBuffer();

            // Write the processed image to the specified path
            fs.writeFileSync(imagePath, imageBuffer);

            // Remove the original file after processing
            fs.unlinkSync(file.path);

            processedImages.push(filename);
          } catch (error) {
            console.log(`Error occurred while processing the image: ${error}`);
            // Handle the error appropriately
            res.status(500).send("Error processing the image");
            return; // Stop further execution
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
    console.log(`Toggling Product Status.`);
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
    console.log(`id: ${id}`);
    const Categories = await Category.find({ isUnlisted: false });
    const product = await Product.findById(id);
    console.log(`Editing the product : ${product.name}`);
    res.render("edit_product", { product: product, categories: Categories });
  } catch (error) {
    console.log(`Error loading Edit Products`);
  }
};

// Edit product.
const editProduct = async (req, res) => {
  try {
    // console.log(`Adding New Product to DB.`);
    console.log(req.body);
    const { id } = req.query;
    console.log(id);

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
      // if (!req.files || req.files.length === 0) {
        // res.status(400).send(`No images uploaded.`);
        // return;
        // req.files =
      // }

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

          // Check if the file exists before processing
          // if (!fs.existsSync(file.path)) {
          //   console.log(`Input file is missing: ${file.path}`);
          //   res.status(400).send("Input file is missing");
          //   return;
          // }

          try {
            // Process the image using Sharp
            const imageBuffer = await sharp(file.path)
              .resize(440, 440)
              .toBuffer();

            // Write the processed image to the specified path
            fs.writeFileSync(imagePath, imageBuffer);

            // Remove the original file after processing
            fs.unlinkSync(file.path);

            processedImages.push(filename);
          } catch (error) {
            console.log(`Error occurred while processing the image: ${error}`);
            // Handle the error appropriately
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
    // console.log(req.body);
    // console.log(req.query);
    const { productId, index } = req.body;
    // console.log(productId);
    // Find the product by ID
    const product = await Product.findById(productId);

    console.log(`deleting the image ${index} of ${product.name}`);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Remove the image from the product's media array
    product.media.splice(index, 1);

    // Save the updated product
    await product.save();

    // Respond with success message
    // res.status(200).json({ message: "Image deleted successfully" });
    res.redirect(`/admin/edit_product?id=${productId}`);
  } catch (error) {
    // Handle errors
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
};

//  get products
const getProducts = async (req, res) => {
  try {
    // console.log(`getting products.`);
    const products = await Product.find({ isUnlisted: false });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error searching users" });
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
};
