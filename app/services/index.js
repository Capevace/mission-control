/**
 * ### The Services
 * Services in Mission Control enable most of the functionality. They are modular but still integrated into the platform.
 *
 * @todo Make services a little more dynamic.
 * @since 1.0.0
 * @module @services
 */
// const kodiService = require('./kodi');
const notificationsService = require('./notifications');
const spotifyService = require('./spotify');
const systemInfoService = require('./system-info');
const homekitService = require('./homekit');
const bahn = require('./bahn');
const covid = require('./covid');
const layout = require('./layout');
// const plugins = require('./plugins');

// module.exports = function createServiceContainer(config, http, state) {
// 	const serviceContext = {
// 		config,
// 		http,
// 		state
// 	};

// 	const 

// 	return services;
// };

module.exports = {
	actions: {
		...notificationsService.actions,
		...spotifyService.actions,
		...systemInfoService.actions,
		...homekitService.actions,
		...bahn.actions,
		...covid.actions,
		...layout.actions,
	},
	events: {
		...homekitService.events
	},

	/**
	 * Start the services last and populate the services object.
	 *
	 * Don't call this method manually!
	 *
	 * @protected
	 */
	async startServices() {
		await notificationsService.init();
		await spotifyService.init();
		await systemInfoService.init();
		await homekitService.init();
		await bahn.init();
		await covid.init();
		await layout.init();
	}
};
