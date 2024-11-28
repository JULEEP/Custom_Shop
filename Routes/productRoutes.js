import express from 'express'
const router = express.Router();
import {
     getAllProduct,
     getOneProduct,
     updateProduct,
     deleteProduct,
     featuredProduct,
     recentViewedProduct,
     getProductCount,
     createProduct,
     bestSellerProducts,
     searchByKeyword,
} from '../Controller/productCtrl.js';
import { isUser, isAdmin } from '../Middlewares/authMiddleware.js'
import multer from 'multer';

// Set up storage for multer (saving images to a directory)
const storage = multer.diskStorage({
     destination: (req, file, cb) => {
       cb(null, 'uploads/'); // save in 'uploads' folder
     },
     filename: (req, file, cb) => {
       cb(null, Date.now() + '-' + file.originalname); // create a unique filename
     },
   });
   
   const upload = multer({ storage: storage });


router.post("/create-product", upload.array("images", 5), createProduct);
router.get('/', getAllProduct)
router.get('/best-seller', bestSellerProducts)
router.get('/:id', getOneProduct)
router.get('/product-search/search', searchByKeyword)
router.put('/:productId', updateProduct)
router.delete('/:id', deleteProduct)
router.get('/count', getProductCount)
router.get('/get/featured/:count', featuredProduct)
//router.put('/wishlist/:id', addToWishlist)
router.get('/recentviewed', recentViewedProduct)







export default router