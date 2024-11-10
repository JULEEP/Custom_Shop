import mongoose from 'mongoose';

// Declare the schema of the Mongo model for addresses
const addressSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    emirates: { type: String },
    area: { type: String },
    streetAddress: { type: String },
    apartment: { type: String },
    gender: { type: String },
    hotel: { type: String },
    villa: { type: String },
    postalCode: { type: String },
    fullName: {
        type: String
      },
      email: {
        type: String
      },
      phone: {
        type: String
      },
      addressLine1: {
        type: String
      },
      addressLine2: {
        type: String
      },
      area: {
        type: String
      },
      zipcode: {
        type: String
      },
      country: {
        type: String
      },
      city: {
        type: String
      },
}, {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
});

// Create and export the `Address` model based on the schema
const AddressModel = mongoose.model('Address', addressSchema);
export default AddressModel;
