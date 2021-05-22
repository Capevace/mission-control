const autoBind = require('auto-bind');
const EventEmitter = require('events');

/**
 * Action handler
 * @callback ActionHandler
 * @param {object} data The request data
 * @param {ActionHandlerContext} context Context with helpers
 * @returns {object} The data to return
 */

/**
 * Sync engine service class
 */
class Service {
	/**
	 * A Sync engine service
	 * @param  {string} name         Service name / identifier
	 * @param  {object} initialState Initial service state
	 * @return {Service}
	 */
	constructor(name, initialState = {}) {
		/**
		 * The service name
		 * @type {string}
		 */
		this.name = name;

		/**
		 * The service internal state
		 *
		 * @readonly
		 * 
		 * @type {object}
		 */
		this.state = Object.freeze(initialState);

		/**
		 * The action handlers and metadata
		 * @type {HandlerData}
		 */
		this.handlers = {};

		/**
		 * Internal event emitter
		 * @type {EventEmitter}
		 */
		this.events = new EventEmitter();

		autoBind(this);
	}

	/**
	 * Set the state and merge the new data
	 *
	 * When setting state with this function, state will me merged with Object.assign
	 * 
	 * @param {object} newState New state
	 * @emits
	 */
	setState(newState) {
		this.state = Object.freeze({
			...this.state,
			...newState
		});

		this.emitter.emit('state', this.state);
	}

	/**
	 * Create new action
	 * @param  {string} name                          Action name / identifier
	 * @param  {object | undefined} options           Action handler options
	 * @param  {ActionHandler | undefined}                [options.handler] The action handler
	 * @param  {object | undefined}                       [options.schema]  The Joi schema
	 * @param  {Array.<PermissionTriple> | undefined}     [options.permissions]  The Joi schema
	 * @return {ActionBuilder}                        The action builder helpers
	 */
	action(name, options = {}) {
		/**
		 * Action options
		 * @typedef {ActionOptions}
		 */
		options = {
			handler: () => { throw new Error(`Action '${name}' in service '${this.name}' has no handler`); },
			schema: null,
			...options,
			permissions: [
				['update', 'service', 'any'],
				...(options.permissions || [])
			]
		};

		if (name in Object.keys(this.handlers)) {
			throw new Error(`Action handler for '${name}' already exists on service ${this.name}`);
		}

		/**
		 * @typedef {HandlerData}
		 */
		this.handlers[name] = {
			/**
			 * Joi schema
			 * @type {object}
			 */
			schema: options.schema,

			/**
			 * Required permission triples
			 * @type {Array.<PermissionTriple>}
			 */
			permissions: options.permissions,

			/**
			 * Action handler
			 * @type {ActionHandler}
			 */
			handler: options.handler
		};

		/**
		 * Build an action by adding handlers or permissions to verify.
		 *
		 * Easier to use api with lots of helper functions
		 * 
		 * @typedef {ActionBuilder}
		 */
		let builder = {
			/**
			 * Set the action handler
			 * @param  {Function}        handler  The function to call
			 * @return {ActionBuilder}           Builder for chaining
			 */
			handler(handler) {
				if (typeof handler !== 'function') {
					throw new Error(`Action handler for '${this.name}' has to be a function`);
				}

				this.handlers[this.name].handler = handler;

				return builder;
			},

			/**
			 * Set the action data schema
			 * @param  {object|function}  objectOrFn  The Joi schema or function that returns Joi object when called
			 * @return {ActionBuilder}               Builder for chaining
			 */
			validate(objectOrFn) {
				let schema = objectOrFn;
				if (typeof objectOrFn === 'function') {
					schema = objectOrFn(Joi);
				}

				this.handlers[this.name].schema = schema;

				return builder;
			},

			/**
			 * Set a required permission to run the action
			 * @param  {Permissions.CRUD}   crud      The crud value
			 * @param  {string}             resource  The resource to check for
			 * @param  {Permissions.Scope}  scope     The scope to check
			 * @return {ActionBuilder}               Builder for chaining
			 */
			requirePermission(crud, resource, scope = 'any') {
				if (scope !== 'any' || scope !== 'own') {
					throw new Error(`Permission scope has to be either 'any' or 'own'.`);
				}

				this.handlers[name].permissions.push([crud, resource, scope]);

				return builder;
			},

			/**
			 * Set a required permission to run the action
			 * @param  {Array<Permissions.CRUD | String | Permissions.Scope>}  permission  Permission triple
			 * @return {ActionBuilder} Builder for chaining
			 */
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

	/**
	 * Run action handler if it exists
	 * 
	 * @param  {String} name                  Action name / identifier
	 * @param  {Object} data                  Action data object
	 * @param  {String} [userRole = 'system'] Role of user to validate permissions for
	 * @async
	 *
	 * @example await notificationsService.handleAction('create', { /* ... *\/ }, 'user');
	 */
	async invokeAction(name, data, userRole = 'system') {
		if (name in this.handlers) {
			const action = this.handlers[name];

			// Validate permissions
			// Save filters so we can provide a filter function later, that runs all permission filters
			let filters = [];
			for (const permission of action.permissions) {
				const { filter, granted } = this.permissions.evaluate(userRole, ...permission);

				if (!granted) {
					throw new UserError(`${userRole} is not forbidden to ${permission[0]} ${permission[2]} ${permission[1]}`, 403);
				}

				filters.push(filter);
			}

			// Validate data
			if (action.schema) {
				try {
					data = Joi.attempt(data, action.schema);
				} catch (e) {
					throw new UserError(e.message, 400);
				}
			}

			/**
			 * @typedef {ActionHandlerContext}
			 */
			const actionHandlerContext = {
				/**
				 * UserError class
				 * @type {UserError}
				 */
				UserError,

				/**
				 * Joi object validation helper
				 * @type {Joi}
				 */
				Joi,

				/**
				 * Permissions helper
				 * @type {Permissions}
				 */
				permissions: this.permissions,

				/**
				 * Filter data based on all resource permissions
				 *
				 * Depending on applied permissions, this may cross filters that aren't compatible.
				 * Example:
				 * 	create video filters out 'id'
				 * 	create upload filters allows 'id'
				 *
				 * 
				 * @param  {Object} data Data to validate
				 * @return {Object}      Filtered data
				 */
				filter(data) {
					// Run all filters
					for (const filter of filters) {
						data = filter(data);
					}

					return data;
				},

				setState(newState) {

				}
			};
			
			// Run action handler
			const result = await action.handler(data, actionHandlerContext);

			// Emit successful action run event
			this.emitter.emit(`action:${actionName}`);

			return result;
		}
	}

	/**
	 * Subscribe to service state changes
	 * @param  {Function} handler State change handler
	 * @return {Function}         Function to unsubscribe and cleanup
	 */
	subscribe(handler) {
		this.emitter.on('state', handler);

		return () => this.emitter.removeListener('state', handler);
	}

	/**
	 * Run a handler when an action has been successfully called
	 * @param  {string} actionName The action name to listen for
	 * @param  {Function} handler  Callback
	 * @return {Function}          Function to unsubscribe and cleanup
	 */
	on(actionName, handler) {
		this.emitter.on(`action:${actionName}`, handler);

		return () => this.emitter.removeListener(`action:${actionName}`, handler);
	}
}

module.exports = Service;