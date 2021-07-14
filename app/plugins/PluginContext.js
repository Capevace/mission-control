const UserError = require('@helpers/UserError');
const AuthError = require('@helpers/AuthError');

const uuid = require('@helpers/uuid');
const Joi = require('joi');

/**
 * Plugin API context passed to the plugin init function.
 * 
 * This context used to interact with the mission-control system.
 * It contains methods for auth, permissions, http, the sync system, database, etc.
 * 
 * The API is supposed to be developer friendly and well documented 
 * and that goal should be kept in mind while developing.
 * 
 * @class PluginContext
 */
class PluginContext {
	/**
	 * Create a new PluginContext.
	 * 
	 * @param {string}             name         - The name of the plugin.
	 * @param {PluginDependencies} dependencies - The context dependencies (modules)
	 */
	constructor(name, dependencies) {
		/**
		 * Mission Control config instance
		 * @type {Config}
		 */
		this.config = dependencies.config;

		/**
		 * Database API
		 * @type {Database}
		 */
		this.database = dependencies.database;

		/**
		 * HTTP API
		 * @type {HTTPContext}
		 */
		this.http = dependencies.http.createHTTPPluginContext(name);

		/**
		 * Dashboard API
		 * @type {DynamicDashboard}
		 */
		 this.dashboard = dependencies.http.dashboard;

		 /**
		  * Sync API
		  * @type {Sync}
		  */
		this.sync = dependencies.sync;

		/**
		 * Permissions API
		 * @type {Permissions}
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
		 * UserError type for use in plugins
		 * @type {Class.<UserError>}
		 */
		this.UserError = UserError;

		/**
		 * UserError type for use in plugins
		 * @type {Class.<AuthError>}
		 */
		 this.AuthError = AuthError;
	}
}


// service.action('action:')
// 	.requirePermission('create', 'video', 'any')
// 	.handler(async (data, context) => {
// 		// Custom data filtration
// 		const { filter } = permissions.can(context.user.role).createAny('video');

// 		// return some data
// 		// filter based on permissions passed to action
// 		return context.filter({ test: 1 });
// 	})

module.exports = PluginContext;