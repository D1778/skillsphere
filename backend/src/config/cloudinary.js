/**
 * src/config/cloudinary.js
 *
 * Central Cloudinary SDK config. Credentials come from env vars set in
 * the Cloudinary Dashboard (Settings -> API Keys). Import this wherever
 * a Cloudinary storage engine or direct upload/destroy call is needed.
 */
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

module.exports = cloudinary;