/* eslint-disable max-len */
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fluentFfmpeg = require('fluent-ffmpeg');
const heicConvert = require('heic-convert');
const { generateUniqueFilename } = require('./utilities/functions');

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
  const maxSize = 10 * 1024 * 1024; // 10MB

  // Configure Multer with the defined storage and file filter for single file upload
  const singleUpload = multer({ storage, fileFilter, limits: { fileSize: maxSize } }).single('file');

  // Configure Multer with the defined storage and file filter for multiple file upload
  const multipleUpload = multer({ storage, fileFilter, limits: { fileSize: maxSize } }).array('files', 3); // Limit to 3 files

async function singleFileUploadRouteController(req, res, next) {
    // Function to compress image buffer using Sharp
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

  // Function to compress MP4 video using fluent-ffmpeg
  async function compressMP4(filePath) {
    const tempOutputPath = path.join(path.dirname(filePath), `${path.basename(filePath)}-compressed.mp4`);
    try {
      await fluentFfmpeg(filePath)
        .videoCodec('libx264') // Adjust video codec
        .preset('slow') // Adjust compression quality (e.g., 'ultrafast', 'medium')
        .output(tempOutputPath)
        .on('end', async () => {
          await fs.promises.rename(tempOutputPath, filePath); // Overwrite original file
        })
        .on('error', (error) => {
          console.error('Error compressing video:', error);
          // Handle compression errors (e.g., keep original file)
        })
        .run();
    } catch (error) {
      console.error(`Error compressing MP4 ${filePath}:`, error);
      // Handle MP4 compression errors (e.g., keep original file)
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
          await compressMP4(filePath);
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

  // Upper this has all functions

  singleUpload(req, res, async (err) => {
    if (err) {
      // Handle file upload error
      return res.status(500).json({
        error: {
          singleFiles: {
            msg: err.message,
          },
        },
      });
    }

    // Process the file as needed for the specified type (audio, video, document)
    try {
      const { userId, category } = req.params;
      const userDirectory = `${userId}`;
      const imagePath = `./uploads/${req.file.filename}`;

      // extra @@@@@@@@@@@@@@@@@@@@ extra

      const filePath = req.file.path;
      const { mimetype } = req.file;
      const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/heif', 'image/heic', 'image/webp'];
      const allowedVideoFormats = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'];
      console.log(mimetype);

      // extra new

      if (isAllowedFormat(mimetype, allowedImageFormats) || isAllowedFormat(mimetype, allowedVideoFormats)) {
        console.log('mimeType');
        const compressedFilePath = await compressAndOverwriteFile(filePath, mimetype);
        console.log('Compressed file path:', compressedFilePath);
        // Use the compressedFilePath as needed

        res.send('secessfully ');
      } else {
        // If MIME type is not allowed, proceed without compression
        res.send('not uploaded');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return res.status(500).json({
        error: {
          singleFile: {
            msg: error.message,
          },
        },
      });
    }
  });
}

module.exports = {
    singleFileUploadRouteController,

  };
