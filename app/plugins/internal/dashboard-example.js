/**
 * Initialize the plugin
 *
 * @param {PluginAPI} APP
 * @returns {Plugin}
 */
module.exports = function dashboardExample(APP) {
	const { state, logger, config, dashboard } = APP;


	return {
		version: '0.0.1',
		description: 'Dashboard Example'
	};
};