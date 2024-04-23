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

  // Use map instead of forEach to create an array of Promises
  const uploadPromises = filePaths.map(async (filePath) => {
    try {
      const uploadedLink = await uploadFile(filePath);
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
      throw new Error('Upload failed'); // Throw an error if any upload fails
    }
  });

  // Wait for all upload promises to resolve
  await Promise.all(uploadPromises);

  return uploadedFileLinks;
}

module.exports = {
  uploadMultipleFiles,
};
