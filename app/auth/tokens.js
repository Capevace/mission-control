const autoBind = require('auto-bind');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const AuthError = require('@helpers/AuthError');
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
			const { user } = jwt.verify(token, this.sessionSecret, {
				expiresIn: 86400,
				issuer: 'mission-control',
				audience: 'mission-control:api'
			});
			


			const { value, error } = Tokens.tokenSchema.validate({ user });
			if (error) {
				throw new AuthError('Token data invalid', 401);
			}

			return value;
		} catch (e) {
			logger.error('Error verifying JWT', e);
			
			throw new AuthError(e.message, 401);
		}
	}

	verifyCaddyJWT(token, caddySecret) {
		try {
			const { sub } = jwt.verify(token, caddySecret, {});
			
			if (!sub) {
				throw new AuthError('Token data invalid', 401);
			}

			return sub;
		} catch (e) {
			logger.error('Error verifying JWT', e);
			
			throw new AuthError(e.message, 401);
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