const loggers = require('@helpers/logger');
const UserError = require('@helpers/UserError');

const { v4: uuid } = require('uuid');
const Joi = require('joi');

class PluginContext {
	constructor(name, { auth, http, sync, database, config }) {
		this.permissions = auth.permissions;
		this.logger = loggers.createLogger(`${name}`);
		this.http = http.composeAPIContext(name);
		this.database = database;
		this.config = config;
		this.sync = sync;
		this.helpers = {
			uuid
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

module.exports = PluginContext;