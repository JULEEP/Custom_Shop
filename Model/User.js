import mongoose from "mongoose";
import crypto from 'crypto';

// Declare the Schema of the Mongo model
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    name: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    message: {
      type: String,
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    nationality: {
      type: String,
    },
    dob: {
      type: String,
    },
    password: {
      type: String,
    },
    reEnterPassword: {
      type: String,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
    },
    otp: {
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
    addressLine1: {
      type: String
    },
    addressLine2: {
      type: String
    },
    area: {
      type: String
    },
    zipCode: {
      type: String
    },
    country: {
      type: String,
    },
    cart: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Cart" }
    ],
    images: [{ type: String }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    Status: {
      type: String,
      enum: ['active', 'inActive'],
      default: 'active'
    },
    coupons: [
      {
        type: String // Assuming storeName is of type String
      }
    ],
    refreshToken: {
      type: String,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Method to create password reset token
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

// Export the model
const UserModel = mongoose.model("User", userSchema);
export default UserModel;
