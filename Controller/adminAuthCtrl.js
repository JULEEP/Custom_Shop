import AdminModel from "../Model/Admin.js"
import asyncHandler from "express-async-handler"
import validator from "validator"
import ProductModel from "../Model/Product.js"
import generateToken from "../config/jwtToken.js"
import generateRefreshToken from "../config/refreshtoken.js"


const adminRegistration = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const admin = await AdminModel.findOne({ email: email })
  if (admin) {
    return res.status(409).json({ status: "failed", message: "Email or phone already exists" });
  }

  if (name && email && password) {
    try {
      const doc = new AdminModel({
        name: name,
        email: email,
        password: password,
      });
      await doc.save();
      const saved_admin = await AdminModel.findOne({ email: email }).select("-password")

      return res.status(201).json({ message: "Registration Successful", data: saved_admin })

    } catch (error) {
      return res.status(500).json({ status: "failed", message: "Unable to register", error: error.message });
    }
  } else {
    res.status(400).json({ message: "Please fill all the fields" });
  }
})

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await AdminModel.findOne({ email });
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateadmin = await AdminModel.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstName: findAdmin?.firstName,
      lastName: findAdmin?.lastName,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    //throw new Error("Invalid Credentials");
    return res.json({ message: "Invalid Credentials" })
  }
})

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