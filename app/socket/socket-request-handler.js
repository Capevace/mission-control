const AuthError = require('@helpers/AuthError');

/**
 * @callback SocketEventHandler
 *
 * @throws Error
 * @throws UserError
 * @throws AuthError
 * @param {object} data - The incoming data
 * @return {object}     - The data to send back
 */

/**
 * Wrap socket.on with authorization and error handling
 *
 * We check for authentication before we let requests past. You can
 * disable this by setting authCheckEnabled to false.
 * 
 * @param  {SocketIO~Socket}       client                    - Socket IO connected socket
 * @param  {Logger}                logger                    - Logging module
 * @param  {ErrorResponse~compose} composeErrorResponse      - ErrorResponse composer
 * @param  {boolean}               [authCheckEnabled = true] - Wether auth checks should occur before handling
 * @return {SocketHandlerFactory} 
 */
module.exports = function createSocketHandlerFactory(socket, logger, composeErrorResponse, authCheckEnabled = true) {
	/**
	 * Register socket event handler
	 * @callback SocketHandlerFactory
	 * @param  {string} event   - The event name
	 * @param  {SocketEventHandler} handler - The event handler
	 */
	return (event, handler) => {
		socket.on(event, async (data, callback) => {
			try {
				if (!socket.user && authCheckEnabled) {
					throw new AuthError('Unauthorized', 401);
				}

				logger.debug(`received - user: ${socket.user ? socket.user.username : 'unauthenticated'}, event: ${event}`, { data });

				callback({
					status: 200,
					...await handler(data)
				});
			} catch (e) {
				if (!e.isUserError) {
					logger.error('error in event handler: ' + event, { error: e });
				}

				callback(composeErrorResponse(e, socket.user));
			}
		});
	};
}