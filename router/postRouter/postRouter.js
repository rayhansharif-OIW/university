const express = require('express');

// internel imports
// const { getUsers } = require('../../controller/userController/userController');

const { addUserFormDataValidator, addUserFormDataValidatorHandler } = require('../../middlewares/signUp/userValidator');

const { fileUpload } = require('../../middlewares/common/fileUploadMiddleware');
const { avatarUpload, upload } = require('../../middlewares/signUp/avatarUpload');
const { doLoginValidators, doLoginValidationHandler } = require('../../middlewares/login/loginValidators');
const { login, logout, refreshAccessToken } = require('../../controller/userController/userController');
const { verifyJWT } = require('../../middlewares/login/auth.middleware');
const { addPostDataValidator, addPostDataValidatorHandler } = require('../../middlewares/post/postMiddleware');
const { createPost, editPost, createFeedForUser } = require('../../controller/postController/postController');

const postRouter = express.Router();

// add user
postRouter.post('/create', upload(), addPostDataValidator, addPostDataValidatorHandler, fileUpload, createPost);
// process login
postRouter.post('/update', upload(), addPostDataValidator, addPostDataValidatorHandler, fileUpload, editPost);
// secure route

postRouter.get('/read', createFeedForUser);

module.exports = {
    postRouter,
 };
