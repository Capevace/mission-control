/**
 * A file to experiment with different API designs.
 */

// Server Side Sync module

class ServiceController {
	constructor(name, initialState = {}) {
		this.name = name;

		// Service State
		this.state = initialState;
		this.handlers = {
			'action': {
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

				this.handlers[name].handler = handler;

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

				perms.forEach(permissionArray => builder.permission(...permissionArray));

				return builder;
			}
		};

		return builder;
	}
}

//// register action

const service = sync.createService('test');


permissions
	.grant('guest').readAny('video');

permissions
	.grant('user').createAny('video');

service.action('action:')
	.requirePermission('create', 'video', 'any')
	.handler(async (data, context) => {
		// Custom data filtration
		const { filter } = permissions.can(context.user.role).createAny('video');

		// return some data
		// filter based on permissions passed to action
		return context.filter({ test: 1 });
	})

////
class ServiceClient {
	constructor(name, controller) {

	}

	subscribe(nameOrCb, cb) {

	}

	dispatch(name, data) {}
}

class CoreService extends {

}

const RESERVED_SERVICES = ['core'];

/**
 * Sync is the main thing
 */
class Sync {
	constructor() {
		/**
		 * The services that sync manages
		 * @type {Object<string, Service>}
		 */
		this.services = {
			'core': new Service('core')
		};
	}

	createService(name) {
		if (name in this.services) {
			throw new Error(`Service ${name} already exists`);
		}


		const service = new Service(name);
		service.subscribe((state) => {});

		return service;
	}

	service(name) {
		if (!(name in this.services)) {
			throw new UserError(`Unknown service ${service}`, 404);
		}

		const service = this.services[name];

		return {
			dispatch: (...args) => service.dispatch(...args),
			subscribe: (...args) => service.subscribe(...args)
		};
	}
}

const sync = ...;

io.on((socket) => {
	socket.on('sync:action', (data, done) => {
		try {
			try {
				const { service, action, data } = validator.validate(Joi.object({
					service: Joi.string()
						.trim()
						.alphanum()
						.required(),
					action: Joi.string()
						.trim()
						.alphanum()
						.required(),
					data: Joi.object({}).unknown(true)
				}));
			} catch (e) {
				throw new UserError(e.message, 400);
			}

			const userRole = socket.user.role;
			const servicePermissionName = `service:${service}`;
			
			// Can access any services
			const { granted: canReadAnyService } = auth.permissions
				.can(userRole)
				.read('service');

			if (!canReadAnyService) {
				throw new UserError(`You don't have the required permissions to access services.`, 403);
			}

			// Can access specific service
			const { granted: canReadService, filter: filterState } = auth.permissions
				.can(userRole)
				.read(servicePermissionName);

			if (!canReadService) {
				throw new UserError(`You don't have the required permissions to access service '${service}'.`, 403);
			}

			// Can 
			const servicePermissionName = composePermissionNameForServiceAction(service);
			const { granted: canCreateAction, filter: filterActionData } = auth.permissions
				.can(userRole)
				.update(servicePermissionName);

			if (!canCreateAction) {
				throw new UserError(`You don't have the required permissions to dispatch actions on service '${service}'.`, 403);
			}

			const service = sync.service(service);
			service.dispatch(action, filterActionData(data));

		} catch (e) {
			// Log the error only if it's not a UserError
			if (!e.isUserError) {
				logger.error(e);
			}

			// We only send the error message to the user
			// if it's either a UserError or the user has 
			// permission to
			if (e.isUserError ||
				config.debug && auth.permissions.can('user').read('error', 'any').granted) {
				return done({
					error: {
						message: e.message,
						status: e.status || 500
					}
				});
			}
				
			return done({
				error: {
					message: 'Internal Server Error',
					status: 500
				}
			});
		}
	});
})

// Client side
const sync = require('@sync');

// Core is always subscribed, every Mission Control Dashboard instance gets this state
const core = sync.service('core') || sync.core();

const service = sync.service('system-info');
// Check if user can access service

try {
	service.dispatch('action', {
		shit: ''
	});
} catch (e) {

}

const unsubscribe = service.subscribe(() => {});
const unsubscribeText = service.subscribe('cpus.text', (text) => {

});


