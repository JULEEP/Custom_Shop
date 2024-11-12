import mongoose from "mongoose";

var customizedSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customImages: {
    front: { type: String, required: true }, // Image URL or base64 for front side
    back: { type: String, required: true }   // Image URL or base64 for back side
  },
  size: { type: String, required: true },  // Store size (e.g., 'M', 'L', etc.)
  quantity: { type: Number, required: true },  // Store quantity
  createdAt: { type: Date, default: Date.now }

})


const CustomizedModel = mongoose.model('CustomizedProduct', customizedSchema)

export default CustomizedModel

