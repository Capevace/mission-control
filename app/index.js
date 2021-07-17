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
const config  = require('@config');
const logging = require('@helpers/logger');
const Core    = require('./Core');

module.exports = async function startMissionControl() {
	logging.logConfig(config);

	const core = new Core(config, logging);
	await core.boot();

	return core;
};