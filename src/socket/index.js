const socketIO = require('socket.io');

module.exports = function socket(state, http) {
	const server = socketIO(http);

	server.on('connection', function(client) {
		let subscriptions = {};

		console.log('A new client connected via socket.');

		client.on('subscribe', ({ event }) => {
			if (event in subscriptions) return;

			console.log(`A client subscribed to ${event}.`);

			const relayEvent =
				event === '*'
					? (actualEvent, data) => {
							client.emit('*', {
								event: actualEvent,
								data
							});
							console.log(
								`Emitting ${actualEvent} to client on *.`
							);
					  }
					: data => {
							client.emit(event, data);
							console.log(`Emitting ${event} to client.`);
					  };

			subscriptions[event] = state.subscribe(event, relayEvent);
		});

		// When the client wants to unsubscribe remove the event
		client.on('unsubscribe', ({ event }) => {
			if (!(event in subscriptions)) return;

			console.log(`Unsubscribing client from event ${event}.`);

			subscriptions[event]();
			delete subscriptions[event];
		});

		// When the client disconnects unsubscribe all subscriptions
		client.on('disconnect', ({ event }) => {
			console.log('A client disconnected.');

			Object.values(subscriptions).forEach(unsubscribe => unsubscribe());
			subscriptions = null;
		});
	});
};
