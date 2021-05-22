#! /usr/bin/env node
/*
 * Mission Control
 *
 * This file starts the server.
 * Everything is setup in here.
 * Modules that start with @ can be required by any other module as they're
 * self-contained without side-effects.
 */

require('module-alias/register');
const config = require('@config');
const argv = require('@helpers/argv');
const logging = require('@helpers/logger');

module.exports = async function start() {
	logging.logConfig(config);
	logging.progress(startMissionControl);
};

async function startMissionControl(progress) {
	const logger = logging.createLogger('Main', 'cyan');
	const eventLogger = logging.createLogger('Event', 'green');

	logger.info(`Starting Mission Control...`);
	progress('Boot Database', 0.01);

	const database = require('@database'); // eslint-disable-line no-unused-vars

	let sessionSecret = database.get('session-secret', null);
	if (!sessionSecret) {
		sessionSecret = uuid();
		database.set('session-secret', sessionSecret);
	}

	// Start the state machine
	progress('Boot State Machine', 0.1);

	const state = require('@state');
	
	const Sync = require('@sync/Sync');
	const sync = new Sync();

	
	progress('Boot Auth', 0.2);

	const initAuth = require('./auth');
	const auth = initAuth(config, database, sessionSecret);

	
	progress('Load HTTP Server', 0.3);

	const initHttp = require('./http');
	const socket = require('./socket');

	
	progress('Boot HTTP Server', 0.4);

	// Initialize the main mission control http server
	const http = initHttp(state, database, auth, sessionSecret);

	
	progress('Boot Socket Server', 0.5);

	// Initialize the socket server
	const io = socket(state, http, auth); // eslint-disable-line no-unused-vars

	
	progress('Init Plugins', 0.75);

	const plugins = require('./plugins');
	await plugins.initPlugins({
		http,
		state,
		database,
		config
	}, progress);

	
	progress('HTTP Listen', 0.95);
	
	http.server.listen(config.http.port, () => {
		logging.http(`Server listening on port`, config.http.port);
		logging.logReadyMessage(config.http.url, config.auth.url);
	});

	if (config.debug) {
		state.subscribe('*', (event, data) =>
			eventLogger.debug(event, data.actionData || data)
		);
	}
};


// setTimeout(
// 	() =>
// 		state.invokeAction('VIDEO-QUEUE:PUSH', {
// 			video: {
// 				url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
// 				format: 'm4a'
// 			}
// 		}),
// 	2000
// );
