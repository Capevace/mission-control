/**
 * The APP object
 * @typedef {Object} PluginContext
 * @type {object}
 * @property {Object} state
 * @property {Object} logger
 * @property {Object} config
 * @property {Object} dashboard
 * @property {Object} http
 */

/**
 * The plugin object
 * @typedef {Object} Plugin
 * @property {string?} name
 * @property {string} version
 * @property {string} description
 * @property {string?} author
 */

/**
 * Initialize the plugin
 *
 * @param {PluginContext} APP
 * @returns {Plugin}
 */
module.exports = function dashboardExample(APP) {
	const { state, logger, config, dashboard } = APP;


	return {
		version: '0.0.1',
		description: 'Dashboard Example'
	};
};