/**
 * cloudinary.js
 * ----------------------------------------------------------------------------
 * Purpose: Configures the Cloudinary SDK once, using credentials from
 *          environment variables. Imported wherever an upload needs to happen.
 */

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always return https:// URLs
});

module.exports = cloudinary;