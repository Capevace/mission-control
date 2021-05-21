const loggers = require('@helpers/logger');

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

class Service {
	constructor(name, initialState = {}) {
		this.name = name;

		// Service State
		this.state = initialState;
		this.handlers = {
			'action': {
				validate: null,
				permissions: [],
				handler
			}
		};

		autoBind(this);
	}

	action(name, options = {}) {
		options = {
			handler: () => { throw new Error(`Action '${name}' in service '${this.name}' has no handler`); },
			...options,
			permissions: [
				['update', 'service', 'any'],
				...(options.permissions || [])
			]
		};

		if (name in Object.keys(this.handlers)) {
			throw new Error(`Action handler for '${name}' already exists on service ${this.name}`);
		}

		this.handlers[name] = {
			validate: null,
			permissions: options.permissions,
			handler: options.handler
		};

		// We return the action builder, an easier to use api with lots of helper functions.
		// 
		let builder = {
			handler(handler) {
				if (typeof handler !== 'function') {
					throw new Error(`Action handler for '${this.name}' has to be a function`);
				}

				this.handlers[this.name].handler = handler;

				return builder;
			},
			validate(objectOrFn) {
				let schema = objectOrFn;
				if (typeof objectOrFn === 'function') {
					schema = objectOrFn(Joi);
				}

				this.handlers[this.name].validate = schema;

				return builder;
			},
			requirePermission(crud, resource, scope = 'any') {
				if (scope !== 'any' || scope !== 'own') {
					throw new Error(`Permission scope has to be either 'any' or 'own'.`);
				}

				this.handlers[name].permissions.push([crud, resource, scope]);

				return builder;
			},
			requirePermissions(perms) {
				if (!Array.isArray(perms)) {
					throw new Error(`You need to pass permissions as an array like this (e.g. [['read', 'user', 'any'], ['update', 'user', 'own']]`)
				}

				perms.forEach(permissionArray => builder.requirePermission(...permissionArray));

				return builder;
			}
		};

		return builder;
	}

	async handleAction(name, data, userRole) {
		if (name in this.handlers) {
			const action = this.handlers[name];

			// Validate permissions
			let filter = (obj) => obj;
			for (const permission of action.permissions) {
				const { filter, granted } = this.permissions.evaluate(userRole, ...permission);

				if (!granted) {
					throw new UserError(`${userRole} is not forbidden to ${permission[0]} ${permission[2]} ${permission[1]}`, 403);
				}
			}


			
			

			await action.handler(data, {
				filter()
			});
		}
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