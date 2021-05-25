/**
 * ### The Socket Module
 * The socket module handles most communications with clients.
 * Pure HTTP is actually used very rarely within Mission Control,
 * even though the interfaces for it are actually there.
 * <br>
 * Sockets have the advantage that they're real-time, which is very useful for home automation.
 * It also acts as a sort of networked message bus by broadcasting events.
 *
 * @module @socket
 * @requires socket.io
 * @requires jsonwebtoken
 */

const Logger = require('@helpers/logger');
const { Server } = require('socket.io');

const buildErrorResponseComposer = require('@helpers/error-response-factory');
const createSocketHandlerFactory = require('./socket-request-handler');

const handleAuth = require('./auth');
const handleSync = require('./sync');

/**
 * Initialize the socket module.
 * @param  {object}   dependencies
 * @param  {Sync}     dependencies.sync     - Sync module
 * @param  {Database} dependencies.database - Database module
 * @param  {HTTP}     dependencies.http     - HTTP module
 * @param  {Auth}     dependencies.auth     - Auth module
 */
module.exports = function socket({ sync, database, http, auth }) {
	const logger = Logger.createLogger('Socket', 'magenta');
	const server = new Server(http.server, {
		// cookie: {
		// 	name: 'io',
		// 	httpOnly: false
		// }
	});

	server.on('connection', socket => {
		logger.debug('client connected');

		const composeErrorResponse = buildErrorResponseComposer(auth.permissions);

		/**
		 * Context object with helpers for socket handlers
		 * @typedef {SocketContext}
		 */
		const socketContext = {
			/**
			 * Listen for socket events safely, with error handling already built around it.
			 *
			 * This allows us to be able to simply throw errors and have them be handled gracefully.
			 *
			 * @example on('test-event', data => ({ success: data.test > 30 }));
			 * @type {SocketHandlerFactory}
			 */
			on: createSocketHandlerFactory(socket, logger, composeErrorResponse, true),

			/**
			 * Listen for socket events with just error handling. Authentication is disabled!
			 *
			 * Use with caution, socket.user is not guaranteed in your request handler.
			 *
			 * @type {SocketHandlerFactory}
			 */
			unsafeOn: createSocketHandlerFactory(socket, logger, composeErrorResponse, false),

			/**
			 * Compose an error response out of an error
			 * @type {ErrorResponse~compose}
			 */
			composeErrorResponse,

			/**
			 * Permissions
			 * @type {Permissions}
			 */
			tokens: auth.tokens,

			/**
			 * Users database API
			 * @type {Database~UsersAPI}
			 */
			users: database.api.users,

			/**
			 * Sync module
			 * @type {Sync}
			 */
			sync,

			/**
			 * Logger module
			 * @type {Logger}
			 */
			logger
		};

		handleAuth(socket, socketContext);
		handleSync(socket, socketContext);
	});

	// server.use((socket, next) => {
	// 	if (socket.handshake.query && socket.handshake.query.token) {
	// 		const token = socket.handshake.query.token;

	// 		try {
	// 			// Verify JWT received with the secret
	// 			const payload = jwt.verify(token, config.auth.jwtSecret, {
	// 				issuer: config.auth.issuer,
	// 				audience: config.auth.audience
	// 			});

	// 			socket.jwt = token;
	// 			socket.jwtPayload = payload;
	// 			// Authenticated successfully

	// 			next(null);
	// 		} catch (e) {
	// 			log(
	// 				'Client couldnt be authorized. Invalid authentication token.'
	// 			);
	// 			next(new Error('Unauthorized'));
	// 		}
	// 	} else {
	// 		log('Client couldnt be authorized. Missing authentication token.');
	// 		next(new Error('Unauthorized'));
	// 	}
	// });
};
