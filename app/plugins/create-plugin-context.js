const loggers = require('@helpers/logger');
const pkg = require('../../package.json');

module.exports = function createPluginContext(name, { http, state, database, config }) {
	return {
		logger: loggers.createLogger(`${name}`),
		http: http.composeAPIContext(name),
		state: {
			get: state.getState,
			subscribe: state.subscribe,
			run: state.invokeAction,
			addAction(name, reducer, validate = (data) => data) {
				state.registerReducer(name, reducer, validate);
			}
		},
		database,
		config
	};
};