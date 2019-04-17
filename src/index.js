// Host Web UIS
// Make sure Spotify runs in the BG
// Make sure Node RED is running

const state = require('./state');
const http = require('./http');
const socket = require('./socket');

// Initialize the main mission control http server
const server = http(state);
const io = socket(state, server);

setTimeout(() => {
	console.log('State update');
	state.call('TOGGLE_LAMP', { isOn: true });
}, 3000);
