import { Router } from "express";
import { getAllUsers, getUserProfile, updateUserProfile, deleteUserAccount } from "../controller/user.controller.js";
import authorize from '../middleware/auth.middleware.js';
import upload from "../middleware/upload.middleware.js";

const userRouter = Router();

userRouter.get("/", getAllUsers)
userRouter.get("/:id", authorize, getUserProfile)
userRouter.put("/:id", authorize, upload.single('profilePicture'), updateUserProfile)
userRouter.delete("/:id", authorize, deleteUserAccount)

export default userRouter;