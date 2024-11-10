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


router.post('/create-product', isAdmin, createProduct)
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