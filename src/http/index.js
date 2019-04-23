const config = require('@config');
const log = require('@helpers/log').logger('HTTP');

const express = require('express');
const app = express();
const server = require('http').createServer(app);

const stateRoutes = require('./state');
const spotifyRoutes = require('./spotify');
const iftttRoutes = require('./ifttt');

/*
 * This function initializes the main HTTP server for the mission control sysyem.
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 */
module.exports = function http() {
	stateRoutes(app);
	spotifyRoutes(app);
	iftttRoutes(app);

	server.listen(config.http.port, () =>
		log(`Listening on port ${config.http.port}.`)
	);

	return server;
};
