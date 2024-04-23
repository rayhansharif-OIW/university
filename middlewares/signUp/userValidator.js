const createError = require('http-errors');
const { validationResult, check } = require('express-validator');

const { prisma } = require('../../DB/db.config');

const addUserFormDataValidator = [
  // Example validation rules for form data
  check('name')
    .notEmpty().withMessage('Name is required') // Ensure name is not empty
    .trim() // Remove leading and trailing white spaces
    .customSanitizer((value) => value.replace(/\s+/g, ' ')) // Remove extra white spaces
    .isAlpha('en-US', { ignore: '-' })
.withMessage('Name must only contain alphabets'),
  check('email')
    .isEmail().withMessage('invalid email') // Ensure email is not empty

    .trim()
    .custom(async (value) => {
      try {
        const user = await prisma.user.findFirst({
          where: {
            email: value,
          },
        });
        if (user) {
          console.log('email already exist');
          throw createError('Email already is use!');
        }
      } catch (err) {
          console.log('error to check email');
          throw createError(err.message);
      }
    }),
    check('password')
    .trim() // Remove white spaces from the beginning and end of the password
    .custom((value, { req }) => {
      if (/\s/.test(value)) {
        throw createError('Password cannot contain spaces');
      }
      return true;
    }) // Ensure password does not contain spaces
    .isLength({ min: 6 })
.withMessage('Password must be at least 6 characters long'), // Ensure password length is greater than 5

  // Custom middleware to check for validation errors
];

  const addUserFormDataValidatorHandler = (req, res, next) => {
    const errors = validationResult(req);
    const mappedErrors = errors.mapped();
    if (Object.keys(mappedErrors).length === 0) {
      next();
    } else {
      res.status(500).json({ errors: mappedErrors });
    }
  };

  module.exports = {
    addUserFormDataValidator,
    addUserFormDataValidatorHandler,
  };
