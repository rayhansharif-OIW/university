const express = require('express');

// internel imports
// const { getUsers } = require('../../controller/userController/userController');

const { addUserFormDataValidator, addUserFormDataValidatorHandler } = require('../../middlewares/signUp/userValidator');
const { addUser } = require('../../controller/userController/signUpController/signUpController');
const { fileUpload } = require('../../middlewares/common/fileUploadMiddleware');
const { avatarUpload } = require('../../middlewares/signUp/avatarUpload');
const { doLoginValidators, doLoginValidationHandler } = require('../../middlewares/login/loginValidators');
const {
 login, logout, refreshAccessToken, getAllUser,
} = require('../../controller/userController/userController');
const { verifyJWT } = require('../../middlewares/login/auth.middleware');

const userRouter = express.Router();

// add user
userRouter.post('/signup', avatarUpload, addUserFormDataValidator, addUserFormDataValidatorHandler, fileUpload, addUser);
// process login
userRouter.post('/login', doLoginValidators, doLoginValidationHandler, login);
// secure route
// logout
userRouter.post('/logout', verifyJWT, logout);
// refresh-token
userRouter.post('/refresh-token', refreshAccessToken);
// Route to get all users
userRouter.get('/users', getAllUser);

module.exports = {
    userRouter,
 };
