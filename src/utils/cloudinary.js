import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {

    try {

        if (!localFilePath) {
            console.log("No local file path provided");
            return null;
        }

        console.log("Local file path:", localFilePath);

        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto"
            }
        );

        //console.log(
        //    "File uploaded successfully on Cloudinary:",
        //    response.secure_url
        //);
        fs.unlinkSync(localFilePath) // Remove temporary file after successful upload
        return response;

        // Remove temporary file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {

        console.log("========== CLOUDINARY ERROR ==========");
        console.log(error);
        console.log("======================================");

        // Remove temporary file if upload failed
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export { uploadOnCloudinary };