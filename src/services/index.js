// Start the spotify service
const config = require('@config');
const database = require('@database');
const state = require('@state');
const { logger } = require('@helpers/log');

const iftttService = require('./ifttt');
const notificationsService = require('./notifications');
const spotifyService = require('./spotify');
const systemInfoService = require('./system-info');

let services = {};

module.exports = {
	getServices: () => services,

	// Start the services last and populate the services object
	startServices(config, database, state) {
		services = {
			spotify: spotifyService(),
			systemInfo: systemInfoService(),
			ifttt: iftttService(),
			notifications: notificationsService()
		};
	}
};
