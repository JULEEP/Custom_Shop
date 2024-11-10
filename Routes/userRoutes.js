import express from 'express'
const router = express.Router();

import {
  createUser,
  loginUser,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  getWishlist,
  saveAddress,
  verifyEmail,
  userCart,
  getCart,
  addToWishlist,
  deleteCartItem,
  createShippingAddress,
  createEmptyWishlist,
  createAddress,
  updateAddress,
  getUserAddress,
  removeFromWishlist,
  resendOTPForUsers,
  createUserProfile,
  getUserProfile,
} from '../Controller/userCtrl.js'

import {  isUser, isAdmin } from '../Middlewares/authMiddleware.js'



router.post("/register", createUser);
router.post("/forgot-password-token", forgotPasswordToken);
router.post("/cart/:userId", userCart)
router.get("/getcart/:userId", getCart)
router.put("/reset-password/:token", resetPassword);
router.put("/password/:_id", isUser, updatePassword);
router.post("/login", loginUser);
router.get("/all-users", getallUser);
router.get("/refresh", handleRefreshToken);
router.post("/logout", logout);
router.get("/get-wishlist/:id", getWishlist);
router.get("/:id", getaUser);
router.delete("/delete-user/:id", isAdmin, deleteaUser);
router.put("/update-profile/:id", updatedUser);
router.put("/address/:id", isUser, saveAddress);
router.put("/block-user/:id", isAdmin, blockUser);
router.put("/unblock-user/:id", isAdmin,  unblockUser);
router.post('/verify-otp', verifyEmail)
router.post('/wishlist/:id', addToWishlist)
router.delete('/remove-wishlist/:id', removeFromWishlist)
router.delete('/delete-cart/:userId', deleteCartItem);
router.post('/shipping-address/:userId', isUser, createShippingAddress)
router.post('/empty-wishlist/:id', createEmptyWishlist)
router.post('/create-address/:userId', createAddress)
router.put('/update-address/:userId', updateAddress)
router.get('/get-address/:userId', getUserAddress)
router.post('/resend-otp', resendOTPForUsers)
router.post('/create-profile/:userId', createUserProfile)
router.get('/get-profile/:userId', getUserProfile)




export default router