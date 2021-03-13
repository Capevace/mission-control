const config = require('@config');
const logger = require('@helpers/logger').createLogger('Socket Auth');
const jwt = require('jsonwebtoken');

module.exports = function socketAuth(socketIO, verifyAPIToken, onAuthentication) {
	forbidNamespaceConnections(socketIO.nsps);

	socketIO.on('connection', socket => {
		// Set the timeout after which the socket will be disconnected
		// if no authentication is reached before that.
		const authTimeoutId = setTimeout(
			() =>
				socket.emit(
					'unauthorized',
					{
						type: 'TIMEOUT'
					},
					() => socket.disconnect()
				),
			15000
		);
		socket.authenticated = false;

		socket.on('authenticate', ({ token }) => {
			clearTimeout(authTimeoutId);

			// Verify JWT received with the secret
			if (verifyAPIToken(token)) {
				// AUTH SUCCESSFUL
				// We set the authenticated var in the socket instance to true and
				// restore any connections the socket tried to make to namespaces.
				socket.authenticated = true;
				onAuthentication(socket);
				restoreNamespaceConnection(socketIO.nsps, socket);

				socket.emit('authenticated');
			} else {
				logger.debug('Client couldnt be authorized');

				// Send the unauthorized event and disconnect
				socket.emit(
					'unauthorized',
					{
						type: 'INVALID_TOKEN'
					},
					() => socket.disconnect()
				);
			}
		});
	});
};

function forbidNamespaceConnections(namespaces) {
	Object.values(namespaces).forEach(namespace => {
		namespace.on('connect', socket => {
			// If the socket isnt authenticated, we remove it from the connected list.
			// Now it wont get any broadcasts.
			if (!socket.authenticated) {
				delete namespace.connected[socket.id];
			}
		});
	});
}

function restoreNamespaceConnection(namespaces, socket) {
	Object.values(namespaces).forEach(namespace => {
		// Go through all sockets in the namespace and see if our socket is in there.
		// If so, we restore the connection.
		if (
			Object.values(namespace.sockets).reduce(
				(found, s) => found || socket.id === s.id,
				false
			)
		) {
			namespace.connected[socket.id] = socket;
		}
	});
}
