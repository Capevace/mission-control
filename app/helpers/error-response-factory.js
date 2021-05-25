/**
 * Standard error response
 *
 * Error messages are hidden if error is not a UserError 
 * and the user isn't allowed to see sensitive errors.
 * 
 * @typedef {ErrorResponse}
 * @property {number} status        - The response status code (HTTP status codes)
 * @property {object} error         - The error object
 * @property {number} error.status  - The status code
 * @property {string} error.message - Error message
 */

/**
 * Factory function to create error response composing functions
 * @param  {Permissions} permissions - Permissions object
 * @return {ErrorResponse~compose}   - The response compose function
 */
function buildErrorResponseComposer(permissions) {
	/**
	 * Unify error responses into a constant format.
	 *
	 * @callback ErrorResponse~compose
	 * @param  {Error} error   - The error to output
	 * @param  {User}  [user]  - User object to check if internal errors can be sent to client  
	 * @return {ErrorResponse} - Response object
	 */
	return function composeErrorResponse(error, user = null) {
		return {
			status: error.status || 500,
			error: {
				status: error.status || 500,

				// Admins receive internal error messages too
				// Their accounts are considered secure
				// 
				// User error messages are considered safe to send to users, as it's their error
				// 
				// TODO: Use permission system to check if reading internal errors is allowed
				message: error.isUserError || (user && permissions.can(user.role).read('error', 'any').granted)
					? error.message
					: 'I have no idea what just happened... An admin should probably get to work'
			}
		};
	}
}

module.exports = buildErrorResponseComposer;