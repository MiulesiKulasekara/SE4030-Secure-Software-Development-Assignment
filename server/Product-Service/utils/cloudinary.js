import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
 
// Load environment variables from .env file
dotenv.config();
 
// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});
 
const cloudinaryUploadImg = async (fileToUploads) => {
    return new Promise((resolve) => {
        cloudinary.uploader.upload(fileToUploads, (result) => {
            resolve({
                url: result.secure_url,
            }, {
                resource_type: "auto",
            });
        });
    });
};
 
export default cloudinaryUploadImg;