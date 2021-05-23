const autoBind = require('auto-bind');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const logger = require('@helpers/logger').createLogger('Auth');

class Tokens {
	constructor(sessionSecret) {
		this.sessionSecret = sessionSecret;

		autoBind(this);
	}

	generate(user) {
		return jwt.sign({ user: { username: user.username } }, this.sessionSecret, {
			expiresIn: 86400,
			issuer: 'mission-control',
			audience: 'mission-control:api'
		});
	}

	verify(token) {
		try {

			return Tokens.tokenSchema.verify(
				jwt.verify(token, this.sessionSecret, {
					expiresIn: 86400,
					issuer: 'mission-control',
					audience: 'mission-control:api'
				})
			);
		} catch (e) {
			logger.debug('Error verifying JWT', e);
			return false;
		}
	}
}

/**
 * The schema of JWT tokens to validate content against
 * @type {Joi~Schema}
 */
Tokens.tokenSchema = Object.freeze(Joi.object({
	user: Joi.object({
		username: Joi.string()
			.min(1)
			.max(64)
			.alphanum()
			.trim()
			.required()
	}).required()
}));


module.exports = Tokens;