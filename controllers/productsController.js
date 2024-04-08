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
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage }).array("media", 3);

// Render product management page.
const loadProductManagement = async (req, res) => {
  try {
    if (req.session.adminData) {
      const Products = await Product.find({});
      const Categories = await Category.find({ isUnlisted: false });
      console.log(`Rendering Product Management.`);
      // console.log(Categories[0]._id);
      res.render("product_management", {
        products: Products,
        categories: Categories,
      });
    } else {
      console.log(`Couldn't Render Product Management.`);
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send(`Error Rendering Product Management.`);
  }
};

// Render add new product page.
const loadAddProduct = async (req, res) => {
  try {
    console.log(`Rendering Add New Product Page.`);
    const categories = await Category.find({ isUnlisted: false });
    res.render("add_new_product", { categories: categories });
  } catch (error) {
    console.log(`Error Rendering Add New Product Page.`);
  }
};

// Adding the product to database.
const addProduct = async (req, res) => {
  try {
    console.log(`Adding New Product to DB.`);
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
          // Initialize imagePath before using it
          const filename = `${file.originalname} - cropped`;
          const imagePath = path.join(
            __dirname,
            "..",
            "public",
            "uploads",
            filename
          );

          // Check if the file exists before processing
          if (!fs.existsSync(file.path)) {
            console.log(`Input file is missing: ${file.path}`);
            // Handle the error appropriately, e.g., return an error response
            res.status(400).send("Input file is missing");
            return; // Stop further execution
          }

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
const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    // console.log(`id: ${id}`);
    const Categories = await Category.find({ isUnlisted: false });
    const product = await Product.findById(id);
    console.log(`Editing the product : ${product.name}`);
    res.render("edit_product", { product: product, categories: Categories });
  } catch (error) {
    console.log(`Error editing the product.`);
  }
};

// delete images in edit product
const deleteImage = async (req, res) => {
  try {
    console.log(req.body);
    const { id, index } = req.body;
    const Categories = await Category.find({ isUnlisted: false });
    const product = await Product.findById(id);
    console.log(`index: ${index}`);
    console.log(`id: ${id}`);
    await product.updateOne({ _id: id }, { $unset: { [`media.${index}`]: 1 } });
    res.render("edit_product", { categories: Categories, product: product });
  } catch (error) {
    console.log(`Error deleting image in edit product: ${error}`);
    // Handle the error appropriately
    res.status(500).send("Error deleting image");
  }
};

//  get products
const getProducts = async (req, res) => {
  try {
    console.log(`getting products.`);
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
  editProduct,
  deleteImage,
  getProducts,
};
