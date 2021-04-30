const Joi = require('joi');
const validation = require('express-joi-validation');

const validator = validation.createValidator({});
validator.Joi = Joi;

module.exports = validator;