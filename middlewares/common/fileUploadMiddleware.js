/* eslint-disable max-len */
const { uploadMultipleFiles } = require('../../utilities/cloudinary');
const { generateUniqueFilename, isAllowedFormat, compressAndOverwriteFile } = require('../../utilities/functions');

async function fileUpload(req, res, next) {
    // Process the uploaded files
    if (req.files.length > 0) {
        try {
            const { userId, category } = req.params;
            const userDirectory = `${userId}`;

          // Ensure that the category directory exists within the user's directory, and create it if not
            const categoryDirectory = `${userDirectory}/${category}`;

            // Generate unique filenames for each file
            const uniqueFilenames = req.files.map(() => generateUniqueFilename());

            // Process each uploaded file
            const promises = req.files.map((file) => new Promise((resolve, reject) => {
            // Handle file processing inside the Promise constructor without using async/await
            const filePath = file.path;
            const { mimetype } = file;
            const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/heif', 'image/heic', 'image/webp'];
            const allowedVideoFormats = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'];

            console.log(mimetype);

            if (isAllowedFormat(mimetype, allowedImageFormats) || isAllowedFormat(mimetype, allowedVideoFormats)) {
                console.log('mimeType');

                // Compress and overwrite the file
                compressAndOverwriteFile(filePath, mimetype)
                .then((compressedFilePath) => {
                    resolve(compressedFilePath); // Resolve with the compressed file path
                })
                .catch((error) => {
                    console.error('Error compressing file:', error);
                    reject(error); // Reject with the compression error
                });
            } else {
                resolve(); // Resolve with undefined if the file format is not allowed
            }
            }));

            // Wait for all promises to resolve
            const fileUrls = await Promise.all(promises);
            console.log(`fileUrls:${typeof fileUrls}`);
            const arrayOfFileUrl = [];
            fileUrls.map((val) => arrayOfFileUrl.push(val));

            const cloudinaryReturn = await uploadMultipleFiles(arrayOfFileUrl);
            if (!cloudinaryReturn) {
                res.status(500).json({
                    error: {
                        multiFile: {
                        msg: "sorry! you can't upload your attuchment,Your file was big",
                        },
                    },
                });
            }
            // req.cloudinaryReturn = cloudinaryReturn.join(',');
            req.cloudinaryReturn = cloudinaryReturn;
            console.log(req.cloudinaryReturn);

            // Respond with the file URLs
            next();
        } catch (error) {
            console.error('Error uploading files:', error);
            return res.status(500).json({
            error: {
                multiFile: {
                msg: process.env.NODE_ENV === 'development' ? error.message : "sorry! you can't upload your attuchment,Your file was big",
                },
            },
            });
        }
    } else {
        next();
    }
}

module.exports = {
    fileUpload,
};
