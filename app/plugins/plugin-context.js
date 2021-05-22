const loggers = require('@helpers/logger');
const UserError = require('@helpers/UserError');

const Joi = require('joi');

class PluginContext {
	constructor(name, { auth, http, state, database, config }) {
		this.permissions = auth.permissions;
		this.logger = loggers.createLogger(`${name}`);
		this.http = http.composeAPIContext(name);
		this.state = {
			get: state.getState,
			subscribe: state.subscribe,
			invoke: state.invokeAction,
			addAction(name, reducer, validate = (data) => data) {
				state.registerReducer(name, reducer, validate);
			}
		};
		this.database = database;
		this.config = config;
		this.sync = {
			createService: (...args) => new ServiceContext(...args)
		};
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

module.exports.PluginContext = PluginContext;