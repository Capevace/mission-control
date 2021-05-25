const UserError = require('./UserError');

module.exports = class AuthError extends UserError {
	/**
	 * Create a new authorizaton error.
	 *
	 * Can be converted to authentication error by 
	 * changing status to 401 Unauthorized instead of 403 Forbidden.
	 * 
	 * @param  {string} message Error message
	 * @param  {Number} status  Error HTTP status
	 * @return {AuthError}
	 */
	constructor(message, status = 403) {
		super(message, status);

		this.status = status;
		this.errorType = 'auth';
	}


}