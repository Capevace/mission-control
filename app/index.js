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

const startSSOProcess = require('@helpers/sso-process');

module.exports = function startMissionControl() {
	const logger = logging.createLogger('Main', 'cyan');
	const eventLogger = logging.createLogger('Event', 'green');

	logging.logConfig(config);
	logger.info(`Starting Mission Control...`);

	const database = require('@database'); // eslint-disable-line no-unused-vars

	// We spawn a node subprocess.
	// This subprocess is the auth server.
	// We do this, so the user doesn't have to do so manually,
	// and the mission-control binary is self-contained to run everything needed.
	if (argv.sso) {
		const ssoProcess = startSSOProcess(config.auth.url, config.auth.port);

		process.on('SIGINT', () => {
			ssoProcess.kill();
			process.exit();
		});
	} else {
		logger.info('Skipping internal SSO server process');
	}

	// Start the state machine
	const state = require('@state');

	const http = require('./http');
	const socket = require('./socket');

	// Initialize the main mission control http server
	const server = http();
	// Initialize the socket server
	const io = socket(server); // eslint-disable-line no-unused-vars

	const services = require('@services');

	// Register all the reducers in the state machine
	for (const actionKey in services.actions) {
		const action = services.actions[actionKey];
		state.registerReducer(actionKey, action.update, action.validate);
	}

	// Start the services
	services.startServices();

	if (config.debug) {
		state.subscribe('*', (event, data) =>
			eventLogger.debug(event, data.actionData || data)
		);
	}
};


// setTimeout(
// 	() =>
// 		state.callAction('VIDEO-QUEUE:PUSH', {
// 			video: {
// 				url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
// 				format: 'm4a'
// 			}
// 		}),
// 	2000
// );
