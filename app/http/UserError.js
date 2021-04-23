module.exports = class UserError extends Error {
	constructor(message, status = 400) {
		super(message);

		this.status = status;
		this.isUserError = true;
	}
}