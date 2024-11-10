import asyncHandler from 'express-async-handler';
import CategoryModel from '../Model/Category.js';

// Recursive function to create categories
async function createCategoryTree(categories, parentCategory = null) {
  if (!Array.isArray(categories)) {
    throw new Error('Categories must be an array');
  }

  for (let categoryData of categories) {
    const { name, level, children } = categoryData;

    // Create the category
    const newCategory = await CategoryModel.create({
      name,
      level,
      parentCategory,
    });

    // If the category has children, recursively create them
    if (children && children.length > 0) {
      await createCategoryTree(children, newCategory._id);
    }
  }
}

const createCategory = asyncHandler(async (req, res) => {
  try {
    const categoryTree = req.body;

    // Create the category tree
    const data = await createCategoryTree(categoryTree);

    // Fetch all categories from the database

    res.status(201).json({ message: 'Categories created successfully', data:data });
  } catch (error) {
    console.error('Error creating categories:', error);
    res.status(500).json({ error: error.message || 'Internal server error' }); // Sending error message in response
  }
});

// Fetch all categories
const getAllCategories = asyncHandler(async (req, res) => {
  try {
    // Fetch all categories from the database
    const categories = await CategoryModel.find();

    res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const getSingleCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    // Fetch all categories from the database
    const categories = await CategoryModel.findById(id);

    res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const getAllParentCategories = asyncHandler(async (req, res) => {
  try {
    const parentId = req.params.parentId;

    // Fetch parent category
    const parentCategory = await CategoryModel.findById(parentId);

    if (!parentCategory) {
      return res.status(404).json({ error: 'Parent category not found' });
    }

    // Fetch children categories associated with the provided parent category ID
    const childrenCategories = await CategoryModel.find({ parentCategory: parentId });

    // Fetch level 3 categories associated with each child category
    const level3Categories = await Promise.all(childrenCategories.map(async (childCategory) => {
      const level3 = await CategoryModel.find({ parentCategory: childCategory._id });
      return { ...childCategory.toObject(), level3 };
    }));

    res.status(200).json({ parentCategory, childrenCategories: level3Categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});


//delete a category
const deleteCategory = asyncHandler(async(req, res) => {
  try {
    const { categoryId } = req.params;

    // Find the category by ID
    const category = await CategoryModel.findById(categoryId);

    // If the category doesn't exist, return a 404 Not Found response
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete the category from the database
    await CategoryModel.findByIdAndDelete(categoryId);

    // Send a success response
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
})

//update category
const updateCategory = asyncHandler(async(req, res) => {
  try {
    const { categoryId } = req.params;
    const updates = req.body; // Request body should contain the updated category data

    // Find the category by ID and update its properties
    const updatedCategory = await CategoryModel.findByIdAndUpdate(categoryId, updates, { new: true });

    // If the category doesn't exist, return a 404 Not Found response
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Send the updated category as a response
    res.status(200).json({ data: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
})

export { createCategory, getAllCategories, getAllParentCategories, deleteCategory, getSingleCategory };
