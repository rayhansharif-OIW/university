/* eslint-disable max-len */
const multer = require('multer');
const sharp = require('sharp');
const zlib = require('zlib');
/* eslint-disable max-len */
const fs = require('fs');
// const ffmpeg = require('fluent-ffmpeg');

const path = require('path');
const fluentFfmpeg = require('fluent-ffmpeg');
const heicConvert = require('heic-convert');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

// Set the path to the ffmpeg executable
ffmpeg.setFfmpegPath(ffmpegPath);

const { body, validationResult, check } = require('express-validator');
const cloudinary = require('cloudinary').v2;

const { prisma } = require('../DB/db.config');
const { generateUniqueFilename } = require('./functions');
// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dvpsllzoz',
  api_key: '874841992913943',
  api_secret: 'TDWl0seWOFWeF5U6LWoSwR2Jgfg',
});

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

// Function to create a directory if it does not exist
// Function to create a directory if it does not exist
// const createDirectoryIfNotExists = async (directoryPath) => {
//   try {
//     // List all folders in the parent directory
//     const foldersResponse = await cloudinary.api.sub_folders(directoryPath);
//     console.log(`folder response: ${foldersResponse}`);

//     // Check if the directory exists
//     const folderExists = foldersResponse.folders.some((folder) => folder.name === directoryPath);

//     // If the directory does not exist, create it
//     if (!folderExists) {
//       await cloudinary.api.create_folder(directoryPath);
//     }
//   } catch (error) {
//     console.error('Error creating directory:', error.message);
//   }
// };

// Function to check if the given MIME type is allowed for compression
function isAllowedFormat(format, allowedFormats) {
  return allowedFormats.includes(format);
}

// Compress file data using gzip with a specific compression level
function compressData(data, callback) {
  zlib.gzip(data, { level: 6 }, callback); // Level 6 provides a good balance of compression ratio and speed
}

// Middleware for single file upload
// Middleware for single file upload
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

    // Upper this has all functions
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
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
      // Handle errors (e.g., keep original file with a suffix like ".original")
    }
  }

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

      // Generate a unique filename for the uploaded file
      const uniqueFilename = generateUniqueFilename(req.file.originalname);
      console.log(req.file);
      console.log(req.file.path);
      console.log(uniqueFilename);

      // extra @@@@@@@@@@@@@@@@@@@@ extra

      const filePath = req.file.path;
      const { mimetype } = req.file;
      const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/heif', 'image/heic', 'image/webp'];
      const allowedVideoFormats = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'];
      console.log(mimetype);

      // extra new

      if (isAllowedFormat(mimetype, allowedImageFormats) || isAllowedFormat(mimetype, allowedVideoFormats)) {
        console.log('mimeType');
         fs.readFile(filePath, (err, fileData) => {
          console.log(fileData.length);
            if (err) {
                // Handle error
                console.log('Error reading file:', err);
            }

            compressData(fileData, async (err, compressedData) => {
                if (err) {
                    // Handle compression error
                    console.error('Error compressing data:', err);
                }
                console.log(compressedData.length);
                // Write the compressed data back to the original file path
                fs.writeFile(filePath, compressedData, (err) => {
                  if (err) {
                    // Handle error
                    console.error('Error writing compressed file:', err);
                    return res.status(500).send('Internal Server Error');
                }
                });
            });
        });
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

// Middleware for multiple file upload
// Multiple file upload controller with compression
async function multiFileUploadRouteController(req, res, next) {
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

    // Process the uploaded files
    try {
      const { userId, category } = req.params;
      const userDirectory = `${userId}`;

      // Ensure that the category directory exists within the user's directory, and create it if not
      const categoryDirectory = `${userDirectory}/${category}`;

      // Generate unique filenames for each file
      const uniqueFilenames = req.files.map(() => generateUniqueFilename());

      // Process each uploaded file
      const promises = req.files.map((file) => new Promise((resolve, reject) => {
          const processFile = async () => {
            const filePath = file.path;
            const { mimetype } = file;
            const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/heif', 'image/heic', 'image/webp'];
            const allowedVideoFormats = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'];

            console.log(mimetype);

            if (isAllowedFormat(mimetype, allowedImageFormats) || isAllowedFormat(mimetype, allowedVideoFormats)) {
              console.log('mimeType');

              // Compress and overwrite the file
              try {
                const compressedFilePath = await compressAndOverwriteFile(filePath, mimetype);
                console.log('Compressed file path:', compressedFilePath);
                resolve(compressedFilePath); // Resolve with the compressed file path
              } catch (error) {
                console.error('Error compressing file:', error);
                reject(error); // Reject with the compression error
              }
            } else {
              resolve(); // Resolve with undefined if the file format is not allowed
            }
          };

          processFile();
        }));

      // Wait for all promises to resolve
      const fileUrls = await Promise.all(promises);
      console.log(fileUrls);

      // Respond with the file URLs
      res.json({ files: fileUrls });
    } catch (error) {
      console.error('Error uploading files:', error);
      return res.status(500).json({
        error: {
          multiFile: {
            msg: error.message,
          },
        },
      });
    }
  });
}

module.exports = {
  singleFileUploadRouteController,
  multiFileUploadRouteController,
};
