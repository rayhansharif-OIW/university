/* eslint-disable no-async-promise-executor */
/* eslint-disable max-len */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
// const ffmpeg = require('fluent-ffmpeg');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fluentFfmpeg = require('fluent-ffmpeg');
const heicConvert = require('heic-convert');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

// Set the path to the ffmpeg executable
ffmpeg.setFfmpegPath(ffmpegPath);

const { uploadMultipleFiles } = require('./cloudinary');

// Function to generate a unique filename
const generateUniqueFilename = (originalFilename = 'Default') => {
    const timestamp = Date.now();
    const randomString = crypto.randomUUID();
    const uniqueFilename = `${timestamp}_${randomString}_${originalFilename}`;
    return uniqueFilename;
};

  // Function to create a directory if it does not exist
const createDirectoryIfNotExists = async (directoryPath, storageDb) => {
    try {
      // Check if the directory exists
      const folderExists = await storageDb.api.resource(directoryPath, { type: 'dir' });

      // If the directory does not exist, create it
      if (!folderExists) {
        await storageDb.api.create_folder(directoryPath);
        console.log('create folder');
      }
    } catch (error) {
      console.error('Error creating directory:', error.message);
    }
};

// File upload functions
async function compressImage(filePath, buffer) {
  try {
    const compressedBuffer = await sharp(buffer)
      .jpeg({ quality: 80 }) // Adjust compression quality as needed
      .toBuffer();
    await fs.promises.writeFile(filePath, compressedBuffer);
  } catch (error) {
    console.error(`Error compressing image ${filePath}:`, error);
    // Handle image compression errors (e.g., keep original file)
  }
}

// Function to compress HEIC buffer using heic-convert
async function compressHEIC(filePath, buffer) {
  try {
    const jpgBuffer = await heicConvert({ buffer, format: 'JPEG' });
    await fs.promises.writeFile(filePath, jpgBuffer);
  } catch (error) {
    console.error(`Error compressing HEIC ${filePath}:`, error);
    // Handle HEIC conversion errors (e.g., keep original file)
  }
}

async function compressMP4(filePath, mimetype) {
  if (mimetype !== 'video/mp4') {
    // Not a video format, skip compression
    return;
  }

  try {
    const tempOutputPath = path.join(path.dirname(filePath), `${path.basename(filePath)}-compressed.mp4`);

    console.log(tempOutputPath);
    console.log(filePath);
    console.log('rayhan');

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .fps(30)
        .addOptions(['-crf 28'])
        .on('end', async () => {
          await fs.promises.rename(tempOutputPath, filePath); // Overwrite original file
          resolve();
        })
        .on('error', (error) => {
          console.error('Error compressing video:', error);
          reject(error);
        })
        .save(tempOutputPath);
    });
  } catch (error) {
    console.error(`Error processing video ${filePath}:`, error);
    // Handle errors (e.g., keep original file with a suffix like ".original")
  }
}

// Function to check if MIME type is allowed
function isAllowedFormat(mimetype, allowedFormats) {
  return allowedFormats.includes(mimetype);
}
async function compressAndOverwriteFile(filePath, mimetype) {
  try {
    const buffer = await fs.promises.readFile(filePath);

    switch (mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        await compressImage(filePath, buffer);
        break;
      case 'image/heic':
        await compressHEIC(filePath, buffer);
        break;
      case 'video/mp4':
        await compressMP4(filePath, mimetype);
        break;
      // Handle iOS video format (replace with your iOS video library logic)
      // case 'video/your-ios-video-format':
      //   await compressIOSVideo(filePath);
      //   break;
      default:
        console.log(`${filePath}: Unsupported format, keeping as is.`);
        break;
    }

    console.log(`${filePath}: Successfully compressed and overwritten.`);
    return filePath; // Return the filePath after compression
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    // Handle errors (e.g., keep original file with a suffix like ".original")
    throw error; // Re-throw the error for handling in the calling function if necessary
  }
}
/// / File upload functions

const generateAccessToken = (user) => jwt.sign(
      {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      },
  );
const generateRefreshToken = (user) => jwt.sign(
      {
          id: user.id,
          email: user.email,

      },
      process.env.REFRESH_TOKEN_SECRET,
      {
          expiresIn: process.env.REFRESH_TOKEN_SECRET,
      },
  );

const isPasswordCorrect = async (password, user) => {
  const isCorrect = await bcrypt.compare(password, user.password);
  return isCorrect;
};

module.exports = {
  isPasswordCorrect,
  generateRefreshToken,
  generateAccessToken,
  generateUniqueFilename,
  createDirectoryIfNotExists,
  compressAndOverwriteFile,
  isAllowedFormat,

};
