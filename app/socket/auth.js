const logger = require('@helpers/logger').createLogger('Socket Auth');
const AuthError = require('@helpers/AuthError');

const jwt = require('jsonwebtoken');

/**
 * Handle socket authentication
 * @param  {SocketIO~Socket} socket   - The socket
 * @param  {SocketContext}   context  - Helpers
 */
module.exports = function handleAuth(socket, { unsafeOn, composeErrorResponse, tokens, users }) {

	// forbidNamespaceConnections(socketIO.parentNsps);

	// Set the timeout after which the socket will be disconnected
	// if no authentication is reached before that.
	const createAuthTimeout = () => setTimeout(
		() => {
			socket.emit(
				'authentication_timeout',
				composeErrorResponse(new AuthError(`Authentication timeout`, 408))
			);

			// Wait a bit so auth message had time to reach client and disconnect
			setTimeout(() => {
				socket.disconnect();
			}, 100);
		},
		15000
	);

	let authTimeoutId = createAuthTimeout();

	socket.authenticated = false;
	socket.user = null;

	unsafeOn('authenticate', async ({ token }) => {
		if (authTimeoutId) {
			clearTimeout(authTimeoutId);
			authTimeoutId = null;
		}

		// Verify JWT received with the secret
		try {
			const jwt = tokens.verify(token);
			if (!jwt) {
				throw new AuthError(`Invalid token`, 400);
			}

			const user = await users.find(jwt.user.username);

			if (!user) {
				throw new AuthError(`Could not find user with username ${jwt.user.username}`, 401);
			}

			// AUTH SUCCESSFUL
			// We set the authenticated var in the socket instance to true and
			// restore any connections the socket tried to make to namespaces.
			socket.authenticated = true;
			socket.user = user;
			socket.refreshUser = async () => {
				socket.user = await users.find(jwt.user.username);
			};

			// restoreNamespaceConnection(socketIO.parentNsps, socket);

			return { user };
		} catch (e) {
			if (!authTimeoutId)
				authTimeoutId = createAuthTimeout();

			// Pass error to socket handler
			throw e;
		}
	});
};

// function forbidNamespaceConnections(namespaces) {
// 	Object.values(namespaces).forEach(namespace => {
// 		namespace.on('connect', socket => {
// 			// If the socket isnt authenticated, we remove it from the connected list.
// 			// Now it wont get any broadcasts.
// 			if (!socket.authenticated) {
// 				namespace.sockets.delete(socket.id);
// 			}
// 		});
// 	});
// }

// function restoreNamespaceConnection(namespaces, socket) {
// 	Object.values(namespaces).forEach(namespace => {
// 		// Go through all sockets in the namespace and see if our socket is in there.
// 		// If so, we restore the connection.
// 		if (
// 			Object.values(namespace.sockets).reduce(
// 				(found, s) => found || socket.id === s.id,
// 				false
// 			)
// 		) {
// 			namespace.sockets.set(socket.id, socket);
// 		}
// 	});
// }
