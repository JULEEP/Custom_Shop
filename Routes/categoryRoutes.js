import express from 'express'
import { createCategory, deleteCategory, getAllCategories, getAllParentCategories, getSingleCategory } from '../Controller/categoriesCtrl.js'
const router = express.Router()

router.post('/create-categories', createCategory)
router.get('/all-categories', getAllCategories);
router.get('/get-parent/:parentId', getAllParentCategories)
router.delete('/:categoryId', deleteCategory)
router.get('/get-singlecat/:id', getSingleCategory)


export default router