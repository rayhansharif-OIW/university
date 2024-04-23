const cloudinary = require('cloudinary').v2;

const fs = require('fs');

cloudinary.config({
  cloud_name: 'dvpsllzoz',
  api_key: '874841992913943',
  api_secret: 'TDWl0seWOFWeF5U6LWoSwR2Jgfg',
});
// Function to delete a file from the file path if it exists
// Function to delete a file from the file path if it exists
// Function to delete a local file
function deleteLocalFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Local file ${filePath} deleted successfully.`);
  } else {
    console.log(`Local file ${filePath} does not exist.`);
  }
}
// Function to upload a single file
// Function to upload a single file to Cloudinary
async function uploadFile(filePath) {
  try {
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
    });
    // console.log(response);
    deleteLocalFile(filePath); // Delete the local file after successful upload
    return response.secure_url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Function to delete uploaded files from Cloudinary
async function deleteUploadedFiles(publicIds) {
  const deletePromises = publicIds.map((publicId) => new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    }));
  await Promise.all(deletePromises);
}

// Function to upload multiple files to Cloudinary
async function uploadMultipleFiles(filePaths) {
  const uploadedFileLinks = [];
  const uploadedPublicIds = [];

  filePaths.forEach(async (filePath) => {
    try {
      const uploadedLink = await uploadFile(filePath);
      console.log(uploadedLink);
      uploadedFileLinks.push(uploadedLink);
    } catch (error) {
      console.error('Error uploading files:', error);
      // If any upload fails, delete all uploaded files from Cloudinary
      if (uploadedPublicIds.length > 0) {
        try {
          await deleteUploadedFiles(uploadedPublicIds);
        } catch (deleteError) {
          console.error('Error deleting uploaded files from Cloudinary:', deleteError);
        }
      }
      return []; // Return blank array if any upload fails
    }
  });

  return uploadedFileLinks;
}
// const uploadOnCloundinary = async (localFilePath, userId) => {
//   try {
//     if (!localFilePath) {
//       return null;
//     }

//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: 'auto',
//       public_id: userId,
//     });
//     console.log('uploaded successfully');
//     return response;
//   } catch (error) {
//     console.log('error');
//     fs.unlinkSync(localFilePath);
//     return null;
//   }
// };

module.exports = {
  uploadMultipleFiles,
};
