import ProductModel from '../Model/Product.js'
import customizedModel from '../Model/CustomizedProduct.js';
import asyncHandler from 'express-async-handler'
//create a product

const createProduct = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      stock,
      discountPercentage,
      brand,
      bulletPoint,
      modelNumber,
      style,
      numberOfItems,
      itemTypeName,
      numberOfPieces,
      productBenefits,
      color,
      size,
      available,
    } = req.body;

    // Ensure images are present in the request
    let images = req.files ? req.files : [];

    // If only one image is uploaded, make it an array for consistency
    if (!Array.isArray(images)) {
      images = [images];
    }

    // Process images to store only the file paths/URLs
    const imagePaths = images.map(file => `/uploads/${file.filename}`);  // Store the relative file path or URL

    // Create the product object
    const product = new ProductModel({
      title,
      description,
      price,
      images: imagePaths, // Save array of image paths
      category,
      stock,
      discountPercentage,
      brand,
      bulletPoint,
      modelNumber,
      style,
      numberOfItems,
      itemTypeName,
      numberOfPieces,
      productBenefits,
      color,
      size,
      available,
      createdDate: Date.now(),
    });

    // Calculate discountPrice if discountPercentage is provided
    if (discountPercentage) {
      product.discountPrice = Math.round(product.price * (1 - product.discountPercentage / 100));
    }

    // Check if the product is out of stock
    if (product.stock === 0) {
      return res.status(400).json({ error: 'Product is out of stock' });
    }

    // Save product to the database
    await product.save();

    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in creating product",
    });
  }
});




const getAllProduct = asyncHandler(async (req, res) => {
  try {
    // Extract pagination parameters from query
    let { limit = 10, page = 1 } = req.query;

    // Convert limit and page to integers and ensure they are positive numbers
    limit = parseInt(limit) > 0 ? parseInt(limit) : 10;
    page = parseInt(page) > 0 ? parseInt(page) : 1;

    // Calculate the number of products to skip
    const skip = (page - 1) * limit;

    // Optimize database operations with Promise.all
    const [products = [], totalProducts] = await Promise.all([
      ProductModel.find() // Filter out products with status 'processing'
        .populate("category")
        .sort({ createdAt: 1 }) // Sort by createdAt in ascending order (oldest first)
        .skip(skip) // Skip the products for the current page
        .limit(limit) // Limit the number of products per page
        .lean() // Use lean for faster read operations
    ]);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Send the response
    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      totalProducts,
      products,
      totalPages,
      currentPage: page,
      dataOnPage: products.length // products is guaranteed to be an array, so .length is safe
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
});



const getOneProduct = asyncHandler(async (req, res) => {
  try {
    const { id: productId } = req.params;

    // Fetch the product by ID
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Respond with only the product data
    res.status(200).send({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error('Error retrieving product details:', error);
    res.status(500).send({
      success: false,
      message: "Error while getting product details",
      error: error.message,
    });
  }
});


const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Extract fields from the request body
    const {
      title,
      description,
      price,
      category,
      stock,
      discountPercentage,
      brand,
      bulletPoint,
      modelNumber,
      style,
      numberOfItems,
      itemTypeName,
      numberOfPieces,
      productBenefits,
      color = {}, // Default to empty object if color is not provided
      size,
      available,
      highlights,
    } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Convert color object to an array of objects, if color is not empty
    let colorArray = [];
    if (typeof color === 'object' && color !== null) {
      colorArray = Object.entries(color).map(([name, url]) => ({ name, url }));
    }

    // Handle images if provided
    let images = req.files || [];
    if (!Array.isArray(images)) {
      images = [images];
    }

    // Convert images to base64 if they are provided and check their size
    const uploadedImageUrls = [];
    for (const image of images) {
      if (image.size > 1000000) {
        return res.status(400).json({ error: "Images should be less than 1MB" });
      }
      const imageData = image.buffer.toString('base64');
      uploadedImageUrls.push(`data:${image.mimetype};base64,${imageData}`);
    }

    // Build the updated fields object
    const updatedFields = {
      title,
      description,
      price,
      category,
      stock,
      discountPercentage,
      brand,
      bulletPoint,
      modelNumber,
      style,
      numberOfItems,
      itemTypeName,
      numberOfPieces,
      productBenefits,
      color: colorArray,
      size,
      available,
      highlights,
    };

    // Only add images if they were provided
    if (uploadedImageUrls.length > 0) {
      updatedFields.images = uploadedImageUrls;
    }

    // Calculate and add discountPrice if discountPercentage is provided
    if (discountPercentage) {
      updatedFields.discountPrice = Math.round(price * (1 - discountPercentage / 100));
    }

    // Update the product with the specified fields
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      updatedFields,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Error in updating product",
    });
  }
};



const deleteProduct = asyncHandler(async (req, res) => {
  ProductModel.findByIdAndDelete(req.params.id).then(product => {
    if (product) {
      return res.status(200).json({ success: true, message: 'the product is deleted!', data: product })
    } else {
      return res.status(404).json({ success: false, message: "product not found!" })
    }
  }).catch(err => {
    return res.status(500).json({ success: false, error: err })
  })
})


const getProductCount = async (req, res) => {
  try {
    const total = await ProductModel.estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

//featured product
const featuredProduct = asyncHandler(async (req, res) => {
  const count = req.params.count ? req.params.count : 0
  const products = await ProductModel.find({ isFeatured: true }).limit(+count);

  if (!products) {
    res.status(500).json({ success: false })
  }
  res.send(products);
})

//get best seller Products
const bestSellerProducts = asyncHandler(async (req, res) => {
  try {
    // Request query se category parameter fetch karna
    const { category } = req.query;

    // Filter criteria setup karna
    const filter = {};
    if (category) {
      filter.category = category;
    }

    // Best-selling products ko fetch karna aur sort karna
    const bestSellers = await ProductModel.find(filter)
      .sort({ sold: -1 }) // 'sold' field ke basis par descending order mein sort karna
      .limit(10); // Top 10 best-selling products ko limit karna

    // Successful response
    res.json({
      success: true,
      bestSellers,
    });
  } catch (error) {
    console.error('Error fetching best-selling products:', error);
    // Error response
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
});


// recentViewedProduct
const recentViewedProduct = asyncHandler(async (req, res) => {
  try {
    const recentViews = await ProductModel.find().sort({ timestamps: -1 }).limit(10);
    res.json(recentViews);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//mostSoldProducts
const mostSoldProducts = asyncHandler(async (req, res) => {
  try {
    const mostSoldProducts = await ProductModel.aggregate([
      { $group: { _id, totalQuantitySold: { $sum: '$sold' } } },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 } // Adjust limit as needed
    ]);
    res.json(mostSoldProducts);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})


//get product by keywords

const searchByKeyword = asyncHandler(async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).send({
        success: false,
        message: "Keyword is required",
      });
    }

    const regex = new RegExp(keyword, 'i');
    const suggestions = await ProductModel.find(
      { title: { $regex: regex } },
      { title: 1, _id: 0 } // Only include title field and exclude _id field
    ).limit(10);

    // Function to get a substring around the keyword
    const getShortTitle = (title, keyword) => {
      const words = title.split(' ');
      const keywordIndex = words.findIndex(word => regex.test(word));
      if (keywordIndex === -1) return title; // If keyword is not found, return the full title

      // Determine the start and end index for the substring
      const start = Math.max(0, keywordIndex - 2); // Take 2 words before the keyword
      const end = Math.min(words.length, keywordIndex + 3); // Take 2 words after the keyword

      // Create the short title
      return words.slice(start, end).join(' ');
    };

    // Extract and shorten titles
    const titles = suggestions.map(suggestion => getShortTitle(suggestion.title, keyword));

    res.status(200).send({
      success: true,
      message: "Keyword suggestions",
      suggestions: titles, // Return the shortened titles array
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting keyword suggestions",
      error: error.message,
    });
  }
});

const getTopSellingProducts = asyncHandler(async (req, res) => {
  try {
    // Extract pagination parameters from query
    let { limit = 10, page = 1 } = req.query;

    // Convert limit and page to integers and ensure they are positive numbers
    limit = parseInt(limit) > 0 ? parseInt(limit) : 10;
    page = parseInt(page) > 0 ? parseInt(page) : 1;

    // Calculate the number of products to skip
    const skip = (page - 1) * limit;

    // Optimize database operations with Promise.all
    const [products = [], totalProducts] = await Promise.all([
      ProductModel.find({})
        .populate("category")
        .sort({ sold: -1 }) // Sort by sold in descending order (top-selling first)
        .skip(skip) // Skip the products for the current page
        .limit(limit) // Limit the number of products per page
        .lean(), // Use lean for faster read operations
      ProductModel.countDocuments({ sold: { $gt: 0 } }) // Count total products with sold > 0
    ]);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Send the response
    res.status(200).send({
      success: true,
      message: "Top-selling products fetched successfully",
      totalProducts,
      products,
      totalPages,
      currentPage: page,
      dataOnPage: products.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in getting top-selling products",
      error: error.message,
    });
  }
});


const saveCustomizedProduct = async (req, res) => {
  try {
    const { productId, customImages, size, quantity } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!productId || !customImages || !customImages.front || !customImages.back || !size || !quantity) {
      return res.status(400).json({ error: 'Product ID, custom images for both sides, size, and quantity are required' });
    }

    // Create a new customized product entry
    const customizedProduct = new CustomizedProduct({
      userId,
      productId,
      customImages, // Store both front and back images
      size,
      quantity
    });

    // Save the customized product to the database
    await customizedProduct.save();

    // Send a success response
    res.status(201).json({
      success: true,
      message: 'Customized product saved successfully',
      data: customizedProduct
    });
  } catch (error) {
    console.error('Error saving customized product:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving customized product',
      error: error.message
    });
  }
};

export {
  createProduct,
  getAllProduct,
  getOneProduct,
  updateProduct,
  deleteProduct,
  featuredProduct,
  recentViewedProduct,
  mostSoldProducts,
  getProductCount,
  bestSellerProducts,
  searchByKeyword,
  getTopSellingProducts,
  saveCustomizedProduct
}