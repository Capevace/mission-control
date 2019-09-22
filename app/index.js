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

const DEBUG_MODE = false;

const log = require('@helpers/log').logger('Main', 'cyan');
const eventLog = require('@helpers/log').logger('Event', 'green');
log('Starting Mission Control\n');

const database = require('@database'); // eslint-disable-line no-unused-vars

// Start the state machine
const state = require('@state');

const http = require('./http');
const socket = require('./socket');

// Initialize the main mission control http server
const server = http();
// Initialize the socket server
const io = socket(server); // eslint-disable-line no-unused-vars

// Start all our services
const services = require('@services');
services.startServices();

state.subscribe('*', (event, data) =>
	DEBUG_MODE ? eventLog(event, data) : eventLog(event)
);

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
