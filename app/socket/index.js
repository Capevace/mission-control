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

const logger = require('@helpers/logger').createLogger('Socket', 'magenta');
const { Server } = require('socket.io');
const AuthError = require('@helpers/AuthError');
const socketAuth = require('./auth');

/**
 * Initialize the socket module.
 * @param  {Object} http A http server object.
 * @param  {Object} auth The auth object.
 */
module.exports = function socket(state, http, auth) {
	const server = new Server(http.server, {
		// cookie: {
		// 	name: 'io',
		// 	httpOnly: false
		// }
	});

	socketAuth(server, auth.tokens.verify, client => {
		let subscriptions = {};

		logger.debug('A new client connected');

		// On connection, we emit a initial-state event.
		// The client can use this to populate its state.
		client.emit('initial-state', {
			state: sync.state
		});

		// The client can call actions by emitting the action event.
		// It has to pass the action and associated data.
		client.on('action', async ({ service, action, data }, callback) => {
			logger.debug(`action request - service: ${service}, action: ${action}`);

			try {
				const user = await socket.getUser();

				if (!user) {
					throw new AuthError('Unable to find user', 401);
				}

				const response = await sync.invokeAction(service, action, data, user);

				callback({
					error: null,
					response
				});
			} catch (e) {
				if (!e.isUserError) {
					logger.error('unknown error in action request', e);
				}

				callback({
					error: {
						status: e.status || 500,

						// Admins receive internal error messages too
						// Their accounts are considered secure
						// 
						// User error messages are considered safe to send to users, as it's their error
						message: e.isUserError || user.role === 'admin'
							? e.message
							: 'I have no idea what just happened... An admin should probably get to work'
					}
				});
			}
		});

		// The client can emit a 'subscribe' event to subscribe to the state machines events.
		// These will then get relayed to the socket client.
		client.on('subscribe', ({ service }, callback) => {
			if (event in subscriptions) return;

			logger.debug(`client subscribed to ${event}.`);

			const relayStateUpdates = (state) => {
				client.emit(`sync:state`, {
					service,
					state
				});
			};

			try {
				const service = sync.service(service);

				subscriptions[service] = service.subscribe(relayStateUpdates);
			} catch (e) {
				if (!e.isUserError) {
					logger.error('unknown error in action request', e);
				}

				callback({
					error: {
						status: e.status || 500,

						// Admins receive internal error messages too
						// Their accounts are considered secure
						// 
						// User error messages are considered safe to send to users, as it's their error
						message: e.isUserError || user.role === 'admin'
							? e.message
							: 'I have no idea what just happened... An admin should probably get to work'
					}
				});
			}

			// We save the returned method from the subscribe function to later unsubscribe.
			sync.subscribe(event, relayEvent);
		});

		// When the client wants to unsubscribe remove the event
		client.on('unsubscribe', ({ service }, callback) => {
			if (!(service in subscriptions)) {
				return callback({
					error: {
						status: 202,
						message: `No subscription for service ${service} found`
					}
				});
			}

			logger.debug(`Unsubscribing client from event ${event}.`);

			subscriptions[event]();
			delete subscriptions[event];
		});

		// When the client disconnects unsubscribe all subscriptions
		client.on('disconnect', () => {
			logger.debug('A client disconnected.');

			Object.values(subscriptions).forEach(unsubscribe => unsubscribe());
			subscriptions = null;
		});
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
