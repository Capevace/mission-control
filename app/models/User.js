const Joi = require('joi');

const crypto = require('@helpers/crypto');
const composeModel = require('./compose-model');


/**
 * User type
 * @typedef {User}
 * @property {string}   username    - The username
 * @property {string}   [password]  - The hashed user password
 * @property {string}   displayName - The user's displayable name
 * @property {string}   [avatarUrl] - The url for the user profile avatar
 * @property {UserRole} role        - The url for the user profile avatar
 */
const User = composeModel(Joi.object({
	username: Joi.string()
		.alphanum()
		.min(3)
		.max(64)
		.lowercase()
		.trim()
		.required(),

	password: Joi.string(),

	displayName: Joi.string()
		.min(1)
		.max(64)
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

User.composeTempUser = function composeTempUser(password) {
	return {
		username: 'temp',
		password: crypto.hashPasswordSync(password),
		displayName: 'Temp Admin',
		avatarUrl: 'https://static.wikia.nocookie.net/geosheas-lost-episodes/images/c/c0/Shrekednijrfiugbqg4iuhrqipugheipug.jpg/revision/latest?cb=20200809223801',
		role: 'admin'
	};
};

/**
 * Preset user roles
 * @readonly
 * @enum {string}
 */
User.UserRole = Object.freeze({
	/** Guest user, basically no rights but read */
	guest: 'guest',

	/** Normal user, can do non-sensitive tasks */
	user: 'user',

	/** Admin user can basically do anything */
	admin: 'admin',

	/** 
	 * System user is meant for core and plugins invoking actions.
	 *
	 * We have this so the authorization system always has an authenticated "user" to deal with
	 * and we don't need to check for "do we have a user" all the time.
	 */
	system: 'system'
});

/**
 * The system user
 * @type {User}
 */
User.systemUser = Object.freeze({
	username: 'mission-control',
	displayName: 'Mission Control',

	avatarUrl: null,

	role: User.UserRole.system
});

module.exports = User;