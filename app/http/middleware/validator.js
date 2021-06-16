const Joi = require('joi');
const validation = require('express-joi-validation');

const validator = validation.createValidator({ passError: true });
validator.Joi = Joi;

module.exports = validator;