/* eslint-disable camelcase */
// external imports
const express = require('express');

// internal imports
const { login, logout } = require('../../controller/userController/userController');

const {
  doLoginValidators,
  doLoginValidationHandler,
} = require('../../middlewares/login/loginValidators');
const { redirectLoggedIn } = require('../../middlewares/common/checkLogin');
const { verifyJWT } = require('../../middlewares/login/auth.middleware');

const AuthRouter = express.Router();

// set page title
const page_title = 'Login';

// login page
AuthRouter.get('/', redirectLoggedIn, login);

// process login
AuthRouter.post('/login', doLoginValidators, doLoginValidationHandler, login);

// logout
AuthRouter.post('/logout', verifyJWT, logout);

module.exports = AuthRouter;
