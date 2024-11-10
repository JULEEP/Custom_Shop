import jwt from "jsonwebtoken";
import UserModel from "../Model/User.js";
import AdminModel from "../Model/Admin.js";
import asyncHandler from 'express-async-handler'


const isUser = asyncHandler(async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      // Get Token from header
      token = authorization.split(" ")[1];

      // Verify Token
      const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY);

      // Get User from Token
      req.user = await UserModel.findById(userID).select("-password").populate("roleId")

      next();
    } catch (error) {
      console.log(error);
      res.status(401).send({ status: "failed", message: "Unauthorized User" });
    }
  }
  if (!token) {
    res
      .status(401)
      .send({ status: "failed", message: "Unauthorized User, No Token" });
  }
});


const isAdmin = asyncHandler(async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      // Get Token from header
      token = authorization.split(" ")[1];

      // Verify Token
      const { adminID } = jwt.verify(token, process.env.JWT_SECRET_KEY);

      // Get User from Token
      req.user = await AdminModel.findById(adminID).select("-password").populate("roleId")

      next();
    } catch (error) {
      console.log(error);
      res.status(401).send({ status: "failed", message: "Unauthorized User" });
    }
  }
  if (!token) {
    res
      .status(401)
      .send({ status: "failed", message: "Unauthorized User, No Token" });
  }
})


export { isAdmin, isUser };