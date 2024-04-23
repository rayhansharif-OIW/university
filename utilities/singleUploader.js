/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
/* eslint-disable max-len */
const fs = require('fs');
// const ffmpeg = require('fluent-ffmpeg');
const multer = require('multer');
const sharp = require('sharp');
const createError = require('http-errors');
const path = require('path');
const fluentFfmpeg = require('fluent-ffmpeg');
const heicConvert = require('heic-convert');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

// Set the path to the ffmpeg executable
ffmpeg.setFfmpegPath(ffmpegPath);
const { generateUniqueFilename } = require('./functions');
const { uploadMultipleFiles } = require('./cloudinary');

  // Define the storage configuration using diskStorage
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      // Set the destination directory for uploaded files
      callback(null, './uploads/');
    },
    filename(req, file, callback) {
      // Set the filename for uploaded files
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${uniqueSuffix}-${file.originalname}`); // You can adjust the file extension as needed
    },
  });

  // Define the file filter function
  const fileFilter = (req, file, callback) => {
    // Check if the uploaded file is of the specified type
    const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/heif', 'image/heic', 'image/webp'];
    const allowedVideoFormats = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'];

    // Check if the file is an image or video
    if (allowedImageFormats.includes(file.mimetype)) {
      callback(null, true);
    } else if (allowedVideoFormats.includes(file.mimetype)) {
      callback(null, true);
    } else {
      // Reject the file with an error message
      callback(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
  };

  // Define file size limitation (e.g., 10MB)
  const maxSize = 50 * 1024 * 1024; // 10MB

  // Configure Multer with the defined storage and file filter for multiple file upload
  const multipleUpload = multer({ storage, fileFilter, limits: { fileSize: maxSize } }).array('files', 3); // Limit to 3 files

// Multiple file upload controller with compression
async function multiFileUploadRouteController(req, res, next) {
  // Upper this has all functions
  multipleUpload(req, res, async (err) => {
    if (err) {
      // Handle file upload error
      return res.status(500).json({
        error: {
          multiFile: {
            msg: err.message,
          },
        },
      });
    }
      next();
  });
}

// upstair all are redandent@@@@@@@@@@@@@@

function uploader(

  allowed_file_types,
  max_file_size,
  error_msg,
  max_file = 3,
) {
    // Define the storage configuration using diskStorage
    const storage = multer.diskStorage({
      destination(req, file, callback) {
        // Set the destination directory for uploaded files
        callback(null, './uploads/');
      },
      filename(req, file, callback) {
        // Set the filename for uploaded files
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        callback(null, `${uniqueSuffix}-${file.originalname}`); // You can adjust the file extension as needed
      },
    });

    const upload = multer({
      storage,
      limits: {
        fileSize: max_file_size,
        files: max_file,
      },
      fileFilter: (req, file, cb) => {
        if (allowed_file_types.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(createError(error_msg));
        }
      },
    });
    return upload;
}

module.exports = {

  uploader,
};
