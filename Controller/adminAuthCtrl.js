import AdminModel from "../Model/Admin.js"
import asyncHandler from "express-async-handler"
import validator from "validator"
import ProductModel from "../Model/Product.js"
import generateToken from "../config/jwtToken.js"
import generateRefreshToken from "../config/refreshtoken.js"


const adminRegistration = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Split the name into first and last name
  const [firstName, lastName] = name.split(" "); // Assuming 'name' is the full name (first + last)

  // Validate input fields
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({
      status: "failed",
      message: "Please fill all the fields",
    });
  }

  // Check if an admin with the given email already exists
  const admin = await AdminModel.findOne({ email });
  if (admin) {
    return res.status(409).json({
      status: "failed",
      message: "Email already exists",
    });
  }

  try {
    // Create a new admin document
    const doc = new AdminModel({
      firstName,
      lastName,
      email,
      password,
      role, // Adding role field
    });

    // Save the new admin to the database
    await doc.save();

    // Return the newly created admin, excluding the password field
    const savedAdmin = await AdminModel.findOne({ email }).select("-password");

    return res.status(201).json({
      message: "Registration Successful",
      data: savedAdmin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Unable to register",
      error: error.message,
    });
  }
});


const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation (no need to do frontend validation)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and Password are required' });
  }

  // Check if admin exists
  const findAdmin = await AdminModel.findOne({ email });
  if (!findAdmin) {
    return res.status(401).json({ message: 'Invalid Credentials' });
  }

  // Generate tokens
  const refreshToken = generateRefreshToken(findAdmin._id);
  await AdminModel.findByIdAndUpdate(
    findAdmin._id,
    { refreshToken },
    { new: true }
  );

  // Set refresh token in cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use 'secure' flag in production (HTTPS)
    maxAge: 72 * 60 * 60 * 1000, // 3 days
  });

  // Send response with admin details and access token
  res.json({
    _id: findAdmin._id,
    firstName: findAdmin.firstName,
    lastName: findAdmin.lastName,
    email: findAdmin.email,
    mobile: findAdmin.mobile,
    token: generateToken(findAdmin._id),
  });
});


const adminLogout = asyncHandler(async (req, res) => {
  try {
    res.clearCookie("token").status(200).json({ message: "Logout Successful" })
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "Unable to logout", error: error.message });
  }
})




export {
  adminRegistration,
  adminLogin,
  adminLogout 
}