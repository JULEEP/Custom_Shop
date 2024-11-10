import mongoose from "mongoose";

var categorySchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      parentCategory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      },
      level:{
        type: Number,
        require: true
      },
    },
    {
      timestamps: true,
    }
  );



const CategoryModel = mongoose.model('Category', categorySchema);
export default CategoryModel