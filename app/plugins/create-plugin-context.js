const loggers = require('@helpers/logger');

const { PluginContext } = require('./plugin-context');

module.exports = function createPluginContext(name, { http, state, database, config }) {
	return new PluginContext(name, { http, state, database, config });
};