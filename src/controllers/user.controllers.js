
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";
// Generate access token and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        console.error("Token generation error:", error);

        throw new ApiError(
            500,
            "Something went wrong while generating tokens"
        );
    }
};


// Register user
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password, username } = req.body;

    // Validate required fields
    if (
        [fullname, email, password, username].some(
            (field) => typeof field !== "string" || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check existing user
    const existedUser = await User.findOne({
        $or: [
            { username: username.trim().toLowerCase() },
            { email: email.trim().toLowerCase() }
        ]
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User already exists with the same username or email"
        );
    }

    // Get avatar path
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // Get optional cover image
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // Upload avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.secure_url) {
        throw new ApiError(500, "Avatar upload failed");
    }

    // Upload cover image if provided
    let coverImageUrl = "";

    if (coverImageLocalPath) {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage?.secure_url) {
            throw new ApiError(500, "Cover image upload failed");
        }

        coverImageUrl = coverImage.secure_url;
    }

    // Create user
    const user = await User.create({
        fullname: fullname.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password,
        avatar: avatar.secure_url,
        coverImage: coverImageUrl
    });

    // Remove sensitive fields from response
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while creating the user"
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User created successfully"
        )
    );
});


// Login user
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    // Validate credentials
    if (typeof password !== "string" || password.length === 0) {
        throw new ApiError(400, "Password is required");
    }

    if (
        (typeof email !== "string" || email.trim() === "") &&
        (typeof username !== "string" || username.trim() === "")
    ) {
        throw new ApiError(400, "Username or email is required");
    }

    // Find user by email or username
    const conditions = [];

    if (email?.trim()) {
        conditions.push({ email: email.trim().toLowerCase() });
    }

    if (username?.trim()) {
        conditions.push({ username: username.trim().toLowerCase() });
    }

    const user = await User.findOne({
        $or: conditions
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    // Fetch user without sensitive fields
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    // Cookie settings
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});


// Logout user
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );
});

const refreshaccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");


    }
    try{
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"invalid refresh token, user not found");


        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"invalid refresh token, token mismatch");
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed successfully"
            )
        );
    }catch(error){
        throw new ApiError(401,error?.message || "invalid refresh token");
    }

})     

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshaccessToken
};
