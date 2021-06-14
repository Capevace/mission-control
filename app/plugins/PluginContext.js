const UserError = require('@helpers/UserError');

const { v4: uuid } = require('uuid');
const Joi = require('joi');

class PluginContext {
	constructor(name, { auth, http, sync, database, config, logging }) {
		this.permissions = auth.permissions;
		this.logger = logging.createLogger(`${name}`);
		this.http = http.createHTTPPluginContext(name);
		this.dashboard = http.dashboard;
		this.database = database;
		this.config = config;
		this.sync = sync;
		this.helpers = {
			uuid,
			Joi
		};
		this.UserError = UserError;
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