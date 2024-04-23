const { validationResult, check } = require('express-validator');

const addPostDataValidator = [
   check('title')
     .notEmpty().withMessage('Title is required') // Ensure title is not empty
     .trim(), // Remove leading and trailing white spaces
   check('description')
     .notEmpty().withMessage('Description is required') // Ensure description is not empty
     .trim(), // Remove leading and trailing white spaces
   check('images')
     .optional({ nullable: true })
     .isArray().withMessage('Images must be an array'), // Ensure images, if provided, is an array
   // Custom middleware to check for validation errors
];

const addPostDataValidatorHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  addPostDataValidator,
  addPostDataValidatorHandler,
};
