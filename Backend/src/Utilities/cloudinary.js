import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configuration of Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("No file path provided");
      return null;
    }

    // Check if Cloudinary credentials are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_CLOUD_API_KEY || !process.env.CLOUDINARY_CLOUD_API_SECRET) {
      throw new Error("Cloudinary credentials are missing");
    }

    // Check if the file exists before uploading
    if (!fs.existsSync(localFilePath)) {
      console.log("File does not exist:", localFilePath);
      return null;
    }

    console.time('uploadTime');
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
    console.timeEnd('uploadTime');

    console.log("File uploaded to Cloudinary:", response.url);

    // Delete the file from the server
    deleteLocalFile(localFilePath);

    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);

    // Delete the file even if upload fails
    deleteLocalFile(localFilePath);

    return null;
  }
};

const deleteLocalFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Local file deleted successfully:", filePath);
    } else {
      console.log("Local file does not exist:", filePath);
    }
  } catch (err) {
    console.error("Error deleting local file:", err);
  }
};

export { uploadOnCloudinary };
