module.exports = class UserError extends Error {
	constructor(message, status = 400) {
		super(message);

		this.status = status;
		this.type = 'user';
	}

	/**
	 * If this error is an error caused by the user, not internal (status 400 range)
	 * @return {Boolean}
	 */
	get isUserError() {
		return this.type === 'user';
	}
}