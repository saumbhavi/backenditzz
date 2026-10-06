import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


    // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINNARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null 
        const respose=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"

        })
        //file has been uploaded successfully
        console.log("File has been uploaded successfully on cloudinary",
        response.url);
        return response;

    }catch(error){
        fs.unlinkSync(localFilePath)//removes the locally saved temp file as the upplload operation got  failed 
        return null;
        
    }

}



export{uploadonCloudinary}
console.log(uploadResult);