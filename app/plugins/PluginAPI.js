const UserError = require('@helpers/UserError');
const AuthError = require('@helpers/AuthError');

const uuid = require('@helpers/uuid');
const Joi = require('joi');

/**
 * Plugin API api passed to the plugin init function.
 * 
 * This api used to interact with the mission-control system.
 * It contains methods for auth, permissions, http, the sync system, database, etc.
 * 
 * The API is supposed to be developer friendly and well documented 
 * and that goal should be kept in mind while developing.
 * 
 * @example
 * 	module.exports = function initPlugin(api) {
 * 		// The api contains available APIs
 * 		const { http, sync } = api;
 * 
 * 		// Create the 'my-service' service
 * 		const service = sync.createService('my-service', {
 * 			// data
 * 			counter: 0
 * 		});
 * 
 * 		// Register service action 'increment'
 * 		service.action('increment')
 *			.requirePermission('update', 'my-service')
 *			.handler(async (data, { state }) => {
 *				// state will be synced to clients after handler returns
 *				state.counter++;
 *			});
 * 
 * 		// Create /plugins/my-plugin/external-webhook POST route
 * 		http.post('/external-webhook', function(req, res) { 
 * 			// ...
 * 		});
 * 
 * 		return {
 * 			name: 'My Plugin',
 * 			version: '1.0.0',
 * 			description: 'This is my first plugin',
 * 			author: 'John Doe'
 * 		};
 * 	}
 * 
 * @class PluginAPI
 */
class PluginAPI {
	/**
	 * Create a new PluginAPI.
	 * 
	 * @param {string}             name         - The name of the plugin.
	 * @param {PluginDependencies} dependencies - The api dependencies (modules)
	 * @example
	 * 	const api = new PluginAPI('my-plugin', { config, database, http, auth, logging });
	 */
	constructor(name, dependencies) {
		/**
		 * Mission Control config instance
		 * @type {Config}
		 * @example
		 * 	const { config } = api;
		 * 
		 *  // Log port
		 * 	console.log(config.http.port);
		 */
		this.config = dependencies.config;

		/**
		 * Database API
		 * @type {Database}
		 */
		this.database = dependencies.database;

		/**
		 * HTTP API
		 * @type {PluginHTTPAPI}
		 */
		this.http = dependencies.http.createHTTPPluginAPI(name);

		/**
		 * Dashboard API
		 * @type {DashboardAPI}
		 */
		 this.dashboard = dependencies.http.dashboard;

		 /**
		  * Sync API
		  * @type {Sync}
		  */
		this.sync = dependencies.sync;

		/**
		 * Auth API
		 * @type {AuthAPI}
		 */
		this.auth = dependencies.auth;

		/**
		 * Permissions API
		 * @type {PermissionsAPI}
		 */
		this.permissions = dependencies.auth.permissions;

		/**
		 * Logger API
		 * @type {Logger}
		 */
		this.logger = dependencies.logging.createLogger(`${name}`);

		/**
		 * Helper functions and objects
		 * @typedef {Object} PluginHelpers
		 */
		this.helpers = {
			/**
			 * Generate a new UUID
			 * @function uuid
			 * @returns {string}
			 */
			uuid,

			/**
			 * A Joi instance
			 * @type {Joi}
			 */
			Joi
		};

		/**
		 * Error type to throw when you encounter an error that's caused by a user,
		 * for example validation errors or invalid input.
		 * 
		 * Basically use this if you'd return a 400 status code.
		 * 
		 * Throwing a UserError will return a JSON error response with the error message.
		 * This happens in action handlers, as well as in HTTP routes.
		 * 
		 * 
		 * @type {Class.<UserError>}
		 * @example
		 * 	const { UserError } = api;
		 * 	http.post('/my-route', function(req, res) {
		 * 		// ...
		 * 		if (!req.query.name)
		 *	 		throw new UserError('No name passed', 400);
		 * 	});
		 */
		this.UserError = UserError;

		/**
		 * Error type to throw when you encounter auth errors
		 * @type {Class.<AuthError>}
		 */
		 this.AuthError = AuthError;
	}
}


// service.action('action:')
// 	.requirePermission('create', 'video', 'any')
// 	.handler(async (data, api) => {
// 		// Custom data filtration
// 		const { filter } = permissions.can(api.user.role).createAny('video');

// 		// return some data
// 		// filter based on permissions passed to action
// 		return api.filter({ test: 1 });
// 	})

module.exports = PluginAPI;