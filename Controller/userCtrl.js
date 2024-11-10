import UserModel from '../Model/User.js'
import ProductModel from '../Model/Product.js'
import CartModel from '../Model/Cart.js'
import nodemailer from 'nodemailer'
import asyncHandler from 'express-async-handler'
import generateToken from '../config/jwtToken.js'
import AddressModel from '../Model/Address.js'
import validateMongoDbId from '../utils/validateMongodbId.js'
import generateRefreshToken from '../config/refreshtoken.js'
import ShippingAddressModel from '../Model/ShippingAdd.js'
import {sendOTPVerification, resendOTPForUser}  from '../utils/common.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import sentEmail from './emailCtrl.js'
import dotenv from 'dotenv'
dotenv.config()

// email config
const tarnsporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  }
})


const createUser = asyncHandler(async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Generate a 6-digit OTP
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

    // Set OTP expiry time (5 minutes from now)
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

    // Save user data along with OTP and expiry time
    const user = new UserModel({
      fullName,
      email,
      password,
      otp,
      otpExpiry,
    });

    // Save the new user to the database
    await user.save();

    // Call the function to send OTP for verification
    await sendOTPVerification(user, otp);

    // Generate refresh token
    const refreshToken = generateRefreshToken(user._id);

    // Update user's refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token as an HTTP-only cookie in the response
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 72 * 60 * 60 * 1000, // 3 days expiration time
      sameSite: 'Strict',
    });

    // Generate an access token
    const accessToken = generateToken(user._id);

    // Return user data and access token
    return res.status(201).json({
      success: true,
      message: "OTP sent successfully. Registration complete.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        user
      },
      token: accessToken,
      refreshToken, // Optionally include refresh token in the response
    });
  } catch (error) {
    console.error("Error in creating user:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in creating user",
    });
  }
});

// verify Email for user
const verifyEmail = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  // Validate request body
  if (!otp) {
    return res.status(400).json({ error: "Please provide OTP" });
  }

  try {
    // Check if user exists and OTP is valid
    const user = await UserModel.findOne({ otp: otp });

    if (!user) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    return res.status(200).json({ message: "User login successful" });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the password
    const isPasswordValid = await UserModel.findOne({password})
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate refresh token
    const refreshToken = generateRefreshToken(user._id);

    // Update user's refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure attribute in production
      maxAge: 72 * 60 * 60 * 1000, // Cookie expiration time (3 days)
      sameSite: 'Strict', // Use SameSite attribute for security
    });

    // Generate an access token
    const accessToken = generateToken(user._id);

    // Return user data and access token
    res.json({
      _id: user._id,
      email: user.email,
      token: accessToken,
      refreshToken, // You can choose whether to include the refresh token in the response
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }

});


// handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  console.log(cookie);
  if (!cookie?.refreshToken) throw new Error("No refresh token in Cookies")
  const refreshToken = cookie.refreshToken
  console.log(refreshToken);
  const user = await UserModel.findOne({ refreshToken })
  if (!user) throw new Error("No Refresh token present in db or not matched")
  jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token ")
    }
    const accessToken = generateRefreshToken(user?._id)
    res.json({ accessToken })
  })
});


// logout functionality
const logout = asyncHandler(async (req, res) => {
  // Retrieve the token from cookies or Authorization header
  const token = req.cookies?.jwt || req.headers["authorization"]?.split("Bearer ")[1];

  // Return an error if no token is provided
  if (!token) {
      return res.status(400).json({ error: "No token provided" });
  }

  // Find the user by the provided token
  const user = await UserModel.findOneAndUpdate(
      { refreshToken: token }, // Assuming you're storing the refresh token in the `refreshToken` field
      { refreshToken: "" },
      { new: true }
  );

  // Return an error if no user is found with the provided token
  if (!user) {
      return res.status(400).json({ error: "Invalid token" });
  }

  // Clear the token from cookies
  res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure attribute in production
      sameSite: 'Strict', // Use SameSite attribute for security
  });

  // Send a success response for logout
  return res.status(200).json({ message: "You have been logged out successfully" });
});

// Update a user
const updatedUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const { firstName, lastName, email, phone, nationality, dob } = req.body;


    // Update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        phone,
        nationality,
        dob
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the updated user
    return res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error in updatedUser:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//create user profile
const createUserProfile = asyncHandler(async (req, res) => {
  try {
      const { userId } = req.params;
      const { email, firstName, lastName, phone, nationality, dob } = req.body;

      // Validate input data
      if (!email || !firstName || !lastName || !phone || !nationality || !dob) {
          return res.status(400).json({ error: "All fields are required" });
      }

      // Check if the user exists in the database by userId
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
          return res.status(404).json({ error: "User not found" });
      }

      // Check if the provided email matches the existing user's email
      if (existingUser.email !== email) {
          return res.status(400).json({ error: "Provided email does not match the existing user's email" });
      }

      // Update the user's profile with the provided data
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.phone = phone;
      existingUser.nationality = nationality;
      existingUser.dob = dob;

      await existingUser.save();

      // Return success message along with the updated user's email
      res.json({
          success: true,
          message: "User profile created successfully",
          existingUser

      });
  } catch (error) {
      console.error("Error in createUserProfile:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user by ID in the database and specify the fields to return
    const user = await UserModel.findById(userId)
      .select('email firstName lastName phone nationality dob'); // Specify the fields you want to return

    // Check if the user was found
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user's data
    return res.json({
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationality: user.nationality,
        dob: user.dob
      }
    });
  } catch (error) {
    console.error("Error in getUser:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


// save user Address
const saveAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});


const createAddress = async (req, res) => {
  try {
    // Extract userId from request parameters and address information from request body
    const { userId } = req.params;
    const {
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      area,
      zipcode,
      country,
      city
    } = req.body;

    // Simple validation to check for required fields
    if (!fullName || !email || !phone || !addressLine1 || !area || !zipcode || !country || !city) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Find the user by ID
    const user = await UserModel.findById(userId);

    // If the user doesn't exist, return an error response
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Create a new Address instance with the data from the request body
    const newAddress = new AddressModel({
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      area,
      zipcode,
      country,
      city
    });

    // Save the new address to the database
    await newAddress.save();

    // Add the new address's ID to the user's addresses array
    user.addresses.push(newAddress._id);

    // Save the updated user document to the database
    await user.save();

    // Send a success response with the updated user data
    res.status(201).json({ success: true, message: 'Address added successfully', data: user });
  } catch (error) {
    console.error('Error creating/updating address:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getUserAddress = async (req, res) => {
  try {
      // Request params se userId ko extract karte hain
      const { userId } = req.params;

      // User ko find karte hain aur addresses array ko populate karte hain
      const user = await UserModel.findById(userId)
          .populate('addresses');

      // Check karte hain ki user exists karta hai ya nahi
      if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Success response send karte hain
      res.status(200).json({
          success: true,
          data: {
              addresses: user.addresses
          }
      });
  } catch (error) {
      console.error('Error fetching user addresses:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
  }
};


const updateAddress = async (req, res) => {
  try {
    // Extract the userId and addressId from the request parameters
    const { userId, addressId } = req.params;

    // Extract the updated address information from the request body
    const {
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      area,
      zipcode,
      country,
      city
    } = req.body;

    // Find the user by userId and populate the addresses array
    const user = await UserModel.findById(userId).populate('addresses');

    // If the user is not found, return an error response
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Find the address in the user's addresses array
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);

    // Check if the address was found in the user's addresses array
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    // Update the address in the database using the addressId
    const updatedAddress = await AddressModel.findByIdAndUpdate(
      addressId,
      {
        fullName,
        email,
        phone,
        addressLine1,
        addressLine2,
        area,
        zipcode,
        country,
        city
      },
      { new: true } // Return the updated document
    );

    // If the address is not found, return an error response
    if (!updatedAddress) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    // Update the user's addresses array with the updated address
    user.addresses[addressIndex] = updatedAddress;

    // Save the updated user data to the database
    await user.save();

    // Send a success response with the updated address data
    res.status(200).json({ success: true, message: 'Address updated successfully', data: updatedAddress });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};


// Shipping Address API - Create a new shipping address
const createShippingAddress = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, streetAddress, phoneNumber, city, state, country } = req.body;

    // Check if all required fields are provided
    if (!userId || !firstName || !lastName || !streetAddress || !phoneNumber || !city || !state || !country) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    // Create a new shipping address object
    const shippingAddress = new ShippingAddressModel({
      userId,
      firstName,
      lastName,
      streetAddress,
      state,
      country,
      city,
      phoneNumber
    });

    // Save the shipping address
    await shippingAddress.save();

    res.status(201).json({ success: true, shippingAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await UserModel.find();
    //console.log(getUsers);
    res.json({
      message: "All users retrieved successfully",
      users: getUsers
    });
  } catch (error) {
    console.error("Error in getallUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Get a single user
const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const user = await UserModel.findById(id).populate('cart.products');
    res.json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    throw new Error(error);
  }
});


// dlt a single user
const deleteaUser = asyncHandler(async (req, res) => {
  let { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await UserModel.findByIdAndDelete(id);
    res.json({ message: "User deleted Successfully:", data: deleteaUser, });
  } catch (error) {
    throw new Error(error);
  }
});

//block a user
const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockusr = await UserModel.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json({ message: 'User is blocked', blockusr });
  } catch (error) {
    throw new Error(error);
  }
});


//un block a user
const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await UserModel.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User UnBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});


//update password
const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await UserModel.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json({ message: "Password is updated", updatedPassword });
  } else {
    return res.json(user);
  }
});


//forgot password
const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:4000/api/users/reset-password/${token}'>Click Here</>`;
    const data = {
      to: user.email,
      text: "Hey user",
      subject: "Forgot password link",
      htm: resetURL,
    }
    sentEmail(data)
    res.json(token)
  } catch (error) {
    throw new Error(error);
  }
});


//reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});


//get wishllist
const getWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
      // Find user by ID and populate wishlist with product details
      const user = await UserModel.findById(id)
          .populate({
              path: 'wishlist',
              select: 'title price description images category', // Specify the fields to populate
          });

      // Check if user exists
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Respond with the user's wishlist
      res.json({ message: "Your wishlist is here", wishlist: user.wishlist });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

const userCart = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { quantity, productId, action } = req.body;

    // Fetch the user document
    const user = await UserModel.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ status: false, message: "Invalid user ID" });
    }

    // Validate the product ID
    if (!productId) {
      return res.status(400).json({ status: false, message: "Invalid product ID" });
    }

    // Fetch the cart for the user
    let cart = await CartModel.findOne({ userId });

    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = new CartModel({ userId, products: [] });
    }

    // Find the product item in the cart
    let productItem = cart.products.find(item => item.product && item.product.equals(productId));

    if (productItem) {
      // If product found in the cart
      if (action === 'increment') {
        // Increment the quantity by 1
        productItem.quantity += 1;
      } else if (action === 'decrement') {
        // Decrement the quantity by 1
        if (productItem.quantity > 0) {
          productItem.quantity -= 1;

          // If quantity reaches zero, remove the product from the cart
          if (productItem.quantity === 0) {
            cart.products = cart.products.filter(item => item.product && !item.product.equals(productId));
          }
        } else {
          return res.status(400).json({ status: false, message: "Quantity cannot be negative" });
        }
      } else {
        return res.status(400).json({ status: false, message: "Invalid action" });
      }
    } else {
      // If product is not found in the cart, add it as a new product
      let product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(400).json({ status: false, message: "Product not found" });
      }

      // Add new product to the cart with the given quantity
      cart.products.push({ product: productId, quantity });

      // Update the isInCart field to true
      await ProductModel.findByIdAndUpdate(productId, { isInCart: true }, { new: true });
    }

    // Populate the product field in each productItem
    await CartModel.populate(cart, { path: 'products.product', select: 'title price images isInCart' });

    // Calculate the subtotal and cartTotal
    let subTotal = 0;
    for (let item of cart.products) {
      if (item.product) {
        subTotal += item.product.price * item.quantity;
      }
    }

    // Update the subtotal and cartTotal in the cart
    cart.subTotal = subTotal;
    cart.cartTotal = subTotal; // Assuming cartTotal is the same as subTotal for now

    // Save the updated cart
    await cart.save();
    user.cart.push(productId);

    // Save the updated user document
    await user.save();

    // Fetch the specific product details being updated
    const updatedProduct = await ProductModel.findById(productId);

    // Return the updated cart with details for the specific product only
    return res.status(200).json({
      status: true,
      message: "Product updated in cart",
      product: {
        title: updatedProduct.title,
        quantity: cart.products.find(item => item.product.equals(productId)).quantity,
        price: updatedProduct.price,
        images: updatedProduct.images,
        isInCart: updatedProduct.isInCart
      },
      subTotal,
      cartTotal: cart.cartTotal
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});




//delete cart
const deleteCartItem = asyncHandler(async (req, res) => {
  try {
      const { userId } = req.params;
      const { productId } = req.body;

      // Validate userId and productId
      if (!userId || !productId) {
          return res.status(400).json({ status: false, message: "Invalid userId or productId" });
      }

      // Find the user and cart
      const user = await UserModel.findById(userId);
      const cart = await CartModel.findOne({ userId });

      if (!user || !cart) {
          return res.status(404).json({ status: false, message: "User or cart not found" });
      }

      // Remove the product from the cart
      const productIndex = cart.products.findIndex(item => item.product && item.product.toString() === productId);
      
      if (productIndex === -1) {
          return res.status(404).json({ status: false, message: "Product not found in cart" });
      }

      // Remove the product from cart and recalculate the cart total
      cart.products.splice(productIndex, 1);

      // Calculate the new cart total and subTotal
      let cartTotal = 0;
      cart.products.forEach(item => {
          if (item.product && item.quantity) {
              const quantity = item.quantity;
              const price = item.product.price || 0;
              cartTotal += quantity * price;
          }
      });

      cart.cartTotal = cartTotal;
      cart.subTotal = cartTotal;

      // Save the updated cart
      await cart.save();

      // Return a success response
      res.status(200).json({
          status: true,
          message: "Product removed from cart successfully",
          cart,
      });
  } catch (error) {
      console.error("Error in deleteCartItem:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
  }
});



//get cart 
const getCart = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user's cart by userId and populate the products
    const cart = await CartModel.findOne({ userId })
      .populate({
        path: 'products.product',
        select: 'title price description images category'
      });

    if (!cart) {
      return res.status(200).json({
        status: true,
        cart: [],
        cartTotal: 0,
        subTotal: 0,
      });
    }

    // Filter out invalid products (null or undefined)
    const validProducts = cart.products.filter(item => item.product !== null);

    // Calculate cartTotal and subTotal
    let cartTotal = 0;
    let subTotal = 0;
    const cartDetails = validProducts.map(item => {
      const product = item.product;

      // Ensure the product is not null or undefined
      if (!product) {
        return null;
      }

      const itemTotal = product.price * item.quantity;
      cartTotal += itemTotal;
      subTotal += itemTotal;
      return {
        product: product._id,
        title: product.title,
        price: product.price,
        description: product.description,
        images: product.images,
        category: product.category,
        quantity: item.quantity,
        itemTotal,
      };
    }).filter(item => item !== null); // Filter out any null items

    // Update the cart if necessary
    if (cart.products.length !== validProducts.length) {
      cart.products = validProducts;
      await cart.save();
    }

    // Respond with the cart data
    res.status(200).json({
      status: true,
      cart: cartDetails,
      cartTotal,
      subTotal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Internal server error' });
  }
});



const addToWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params; // User ID
  const { prodId } = req.body; // Product ID

  try {
    // Find the user by ID
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Check if the product is already in the wishlist
    const alreadyAdded = user.wishlist.find((productId) => productId.toString() === prodId);

    if (alreadyAdded) {
      // If the product is already in the wishlist, remove it and set isInWishlist to false
      await UserModel.findByIdAndUpdate(
        id,
        { $pull: { wishlist: prodId } },
        { new: true }
      );

      await ProductModel.findByIdAndUpdate(
        prodId,
        { isInWishlist: false },
        { new: true }
      );
    } else {
      // If the product is not in the wishlist, add it and set isInWishlist to true
      await UserModel.findByIdAndUpdate(
        id,
        { $push: { wishlist: prodId } },
        { new: true }
      );

      await ProductModel.findByIdAndUpdate(
        prodId,
        { isInWishlist: true },
        { new: true }
      );
    }

    // Fetch the updated product details
    const updatedProduct = await ProductModel.findById(prodId);

    if (!updatedProduct) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    // Return the full product details
    return res.status(200).json({
      status: true,
      message: alreadyAdded ? "Product removed from wishlist" : "Product added to wishlist",
      product: updatedProduct // Return the entire product object
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
});


const removeFromWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { prodId } = req.body;
  try {
    // Find and update the user's wishlist by removing the product
    let user = await UserModel.findByIdAndUpdate(
      id,
      {
        $pull: { wishlist: prodId },
      },
      {
        new: true,
      }
    );
    
    // Check if the user exists and the update was successful
    if (user) {
      res.status(200).json({ status: true, message: "Product removed from wishlist", user });
    } else {
      // User not found
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
});


//empty wishlist
const createEmptyWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.wishlist || user.wishlist.length === 0) {
      // If wishlist doesn't exist or is empty, create an empty wishlist
      user.wishlist = [];
      await user.save();
      return res.status(200).json({ message: 'Empty wishlist created successfully', user });
    } else {
      // Wishlist already exists
      return res.status(400).json({ error: 'Wishlist already exists for the user' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//resend otp
const resendOTPForUsers = asyncHandler(async(req, res) => {
  try {
    // Extract user's email from the request body
    const { email } = req.body;

    // Validate the email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate a new OTP (you can implement a function to generate OTPs)
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Create a user object
    const user = {
      email: email,
      // You might want to include additional information like user ID, name, etc.
    };

    // Call the function to resend the OTP
    await resendOTPForUser(user, newOTP);

    // Return a success response
    return res.json({ message: 'OTP resent successfully!' });
  } catch (error) {
    console.error('Error resending OTP:', error.message);
    // Return an error response if something goes wrong
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
})

export {
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
  userCart,
  getCart,
  verifyEmail,
  createShippingAddress,
  addToWishlist,
  deleteCartItem,
  createEmptyWishlist,
  createAddress,
  updateAddress,
  getUserAddress,
  removeFromWishlist,
  createUserProfile,
  getUserProfile,
  resendOTPForUsers,
  
};