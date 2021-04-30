const autoBind = require('auto-bind');
const jwt = require('jsonwebtoken');

const logger = require('@helpers/logger').createLogger('Auth');

module.exports = class Tokens {
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
			return jwt.verify(token, this.sessionSecret, {
				expiresIn: 86400,
				issuer: 'mission-control',
				audience: 'mission-control:api'
			});
		} catch (e) {
			logger.debug('Error verifying JWT', e);
			return false;
		}
	}
}