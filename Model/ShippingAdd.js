// Shipping Address Schema
import mongoose from "mongoose";
const shippingAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  name: {
    type: String,
  },
  fullName: {
    type: String
  },
  email: {
    type: String,
  },
  streetAddress: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  address1: {
    type: String,
  },
  address2: {
    type: String,
  },
  addressLine1: {
    type: String
  },
  addressLine2: {
    type: String
  },
  area: {
    type: String,
  },
  zipCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ShippingAddressModel = mongoose.model('ShippingAddress', shippingAddressSchema);
export default ShippingAddressModel