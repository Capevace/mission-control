const Joi = require('joi');

const crypto = require('@helpers/crypto');
const composeModel = require('./compose-model');

module.exports.User = composeModel(Joi.object({
	username: Joi.string()
		.alphanum()
		.min(3)
		.max(32)
		.lowercase()
		.trim()
		.required(),

	password: Joi.string(),

	displayName: Joi.string()
		.min(1)
		.max(32)
		.trim()
		.required(),

	avatarUrl: Joi.string()
		.trim()
		.max(512)
		.uri(),

	role: Joi.string()
		.pattern(/^admin$|^user$|^guest$/, 'role')
		.required()
}));

module.exports.User.composeTempUser = function composeTempUser(password) {
	return {
		username: 'temp',
		password: crypto.hashPasswordSync(tempPassword),
		displayName: 'Temp Admin',
		avatarUrl: 'https://static.wikia.nocookie.net/geosheas-lost-episodes/images/c/c0/Shrekednijrfiugbqg4iuhrqipugheipug.jpg/revision/latest?cb=20200809223801',
		role: 'admin'
	};
}