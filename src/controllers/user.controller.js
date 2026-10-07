import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadonCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req, res, next) => {

    //take details from the  frontend
    //validation-check if anything or nay imp detail is missing
    //check if user already exist -check if anyhthing unique either username or the email
    // check for the imagess and then check for thee avatar
    //upload them to cloudinary,avatar
    //create user obeject-create netry in db entries 
    //remove the  pas and refresh token field from the field 
    //check for the user creation 
    //return response
    const{fullName,email,password,username} = req.body
    console.log("email: ",email);
    if(
        [fullName,email,password,username].some((field)=>field?.trim()==="") 
    ){
        throw new ApiError("All fields are required",400)
    }
    const existedUser=await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409,"User already exist with the same username or email")



    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }
    const avatar=await uploadonCloudinary(avatarLocalPath)
    const coverImage=await uploadonCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(500,"Avatar upload failed")
    }
    if(!coverImage){
        throw new ApiError(500,"Cover image upload failed")
    }
    const user=await User.create({
        fullName,
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        username:username.toLowerCase(),
        password
    })
    const createdUser=await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while creating the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )
})



    
})  



export {
    registerUser,
}