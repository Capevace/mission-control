/**
 * Handle socket connections for sync
 * @param  {SocketIO~Socket} socket   - The socket
 * @param  {SocketContext}   context  - Helpers
 */
module.exports = function handleSync(socket, { on, sync, logger }) {
	let subscriptions = {};

	// On connection, we emit a initial-state event.
	// The client can use this to populate its state.
	// client.emit('initial-state', {
	// 	state: sync.state
	// });

	// The client can call actions by emitting the action event.
	// It has to pass the action and associated data.
	on('action', async ({ service, action, data }) => {
		logger.debug(`action request - service: ${service}, action: ${action}`);

		return await sync.invokeAction(service, action, data, user);
	});

	// client.on('subscribe', () => console.error('WE HAVE A WINNER'));

	// The client can emit a 'subscribe' event to subscribe to the state machines events.
	// These will then get relayed to the socket client.
	on('subscribe', async ({ service: serviceName }) => {
		logger.debug(`client subscribed: ${serviceName}`);

		if (serviceName in subscriptions) return;

		const relayStateUpdates = (state) => {
			socket.emit(`sync`, {
				service: serviceName,
				state
			});
		};

		const service = sync.service(serviceName);
		subscriptions[serviceName] = service.subscribe(relayStateUpdates);

		// Send initial state
		logger.debug('sending initial state', { service, state: service.state });
		relayStateUpdates(service.state);

		return {
			subscriptions: Object.keys(subscriptions)
		};
	});

	// When the client wants to unsubscribe remove the event
	on('unsubscribe', ({ service }) => {
		if (!(service in subscriptions)) {
			return {
				status: 202
			};
		}

		logger.debug(`Unsubscribing client from service ${service}.`);

		subscriptions[service]();
		delete subscriptions[service];

		return {
			unsubscribed: true
		};
	});

	// When the client disconnects unsubscribe all subscriptions
	socket.on('disconnect', () => {
		logger.debug('A client disconnected.');

		Object.values(subscriptions).forEach(unsubscribe => unsubscribe());
		subscriptions = null;
	});
};