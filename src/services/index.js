/**
 * ### The Services
 * Services in Mission Control enable most of the functionality. They are modular but still integrated into the platform.
 *
 * @todo Make services a little more dynamic.
 * @since 1.0.0
 * @module @services
 */
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
	/**
	 * Get all registered services.
	 * @return {Object.<string, Object>} The services.
	 */
	getServices: () => services,

	/**
	 * Start the services last and populate the services object.
	 *
	 * Don't call this method manually!
	 *
	 * @protected
	 * @param {module:@config} config The main config module.
	 * @param {module:@database} database The database module.
	 * @param {module:@state} state The state module.
	 */
	startServices(config, database, state) {
		services = {
			spotify: spotifyService(),
			systemInfo: systemInfoService(),
			ifttt: iftttService(),
			notifications: notificationsService()
		};
	}
};
