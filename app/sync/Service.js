const autoBind = require('auto-bind');
const EventEmitter = require('events');
const onChange = require('on-change');
const Joi = require('joi');

const User = require('@models/User');

const UserError = require('@helpers/UserError');
const AuthError = require('@helpers/AuthError');

/**
 * Action handler
 * @callback ActionHandler
 * @param   {object}        data    - The request data
 * @param   {ActionContext} context - Action context with request helpers
 * @returns {object}                - The data to return
 */

/**
 * Permission evaluation handler
 * @callback PermissionEvaluationHandler
 * @param   {object}        data    - The request data
 * @param   {ActionContext} context – Action context with helpers
 */

/**
 * Joi object builder function
 * @callback JoiBuilderFunction
 * @param   {Joi} joi    – The joi object
 * @return  {Joi~Schema} – The Joi schema to validate with
 */

/**
 * Permission triple
 *
 * 0: Permissions.CRUD
 * 1: Resource (string)
 * 2: Permissions.Scope
 * 
 * @typedef {PermissionTriple} Array.<Permissions.CRUD | String | Permissions.Scope>
 */


/**
 * Sync engine service class
 */
class Service {
	/**
	 * A Sync engine service
	 * @param  {string}                     name         - Service name / identifier
	 * @param  {object}                     initialState - Initial service state
	 * @param  {DependencyInjectionModules} dependencies - Dependency Injection
	 */
	constructor(name, initialState = {}, dependencies) {
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
		this.emitter = new EventEmitter();
		
		/**
		 * Permissions module
		 * @type {Permissions}
		 */
		this.permissions = dependencies.permissions;

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
			 * @param  {ActionHandler} handler - The function to call
			 * @return {ActionBuilder}         - Builder for chaining
			 */
			handler: (handler) => {
				if (typeof handler !== 'function') {
					throw new Error(`Action handler for '${name}' has to be a function`);
				}

				this.handlers[name].handler = handler;

				return builder;
			},

			/**
			 * Set the action data schema
			 * @param  {Joi~Schema|JoiBuilderFunction} objectOrFn - The Joi schema or function that returns Joi object when called
			 * @return {ActionBuilder}                            - Builder for chaining
			 */
			validate: (objectOrFn) => {
				let schema = objectOrFn;
				if (typeof objectOrFn === 'function') {
					schema = objectOrFn(Joi);
				}

				this.handlers[name].schema = schema;

				return builder;
			},

			/**
			 * Set a required permission to run the action
			 * @param  {Permissions.CRUD}   crud      - The crud value
			 * @param  {string}             resource  - The resource to check for
			 * @param  {Permissions.Scope}  scope     - The scope to check
			 * @return {ActionBuilder}                - Builder for chaining
			 */
			requirePermission: (crud, resource, scope = 'any') => {
				if (scope !== 'any' && scope !== 'own') {
					throw new Error(`Permission scope has to be either 'any' or 'own'.`);
				}

				this.handlers[name].permissions.push([crud, resource, scope]);

				return builder;
			},

			/**
			 * Set a required permission to run the action
			 * @param  {PermissionTriple} permission - Permission triple
			 * @return {ActionBuilder}               - Builder for chaining
			 */
			requirePermissions: (perms) => {
				if (!Array.isArray(perms)) {
					throw new Error(`You need to pass permissions as an array like this (e.g. [['read', 'user', 'any'], ['update', 'user', 'own']]`)
				}

				perms.forEach(permissionArray => builder.requirePermission(...permissionArray));

				return builder;
			},

			/**
			 * Set a required permission to run the action
			 * @param  {PermissionEvaluationHandler} permissionHandler - The callback to evaluate permissions with
			 * @return {ActionBuilder}                                 - Builder for chaining
			 */
			evaluatePermissions: (callback) => {
				this.handlers[name].permissions.push(callback);

				return builder;
			}
		};

		return builder;
	}

	/**
	 * Run action handler if it exists
	 * 
	 * @param  {String} name                     - Action name / identifier
	 * @param  {Object} data                     - Action data object
	 * @param  {User}   [user = User.systemUser] - Role of user to validate permissions for
	 *
	 * @example await notificationsService.handleAction('create', { /* ... *\/ }, 'user');
	 */
	async invokeAction(name, data, user = User.systemUser) {
		if (name in this.handlers) {
			const action = this.handlers[name];

			// TODO: Probably the way we set state right now 
			// is not atomic. This is fine for now but shoud be noted in documentation.
			// Improvement for later
			let stateHasChanged = false;

			let state = Object.assign({}, this.state);
			
			const wrapState = stateToWrap => onChange(state, () => {
				stateHasChanged = true;
			});
			let wrappedState = wrapState(state);

			/**
			 * @typedef {ActionContext}
			 */
			const actionContext = Object.freeze({
				/**
				 * UserError class
				 * @type {UserError}
				 */
				UserError,

				/**
				 * AuthError class
				 * @type {AuthError}
				 */
				AuthError,

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
				 * Permissions helper
				 * @type {Permissions}
				 */
				user,

				/**
				 * Service state object
				 *
				 * The state is wrapped in a proxy to detect changes.
				 * These changes are queued up and once the app handler finished will be flushed
				 * to listeners.
				 *
				 * Changes can also be flushed manually using `state.flush()`.
				 * 
				 * @type {object}
				 */
				get state() {
					return wrappedState;
				},

				set state(newValue) {
					onChange.unsubscribe(wrappedState);

					stateHasChanged = true;
					state = newValue;
					wrappedState = wrapState(state);
				},

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
					onChange.unsubscribe(wrappedState);

					stateHasChanged = true;
					state = newValue;
					wrappedState = wrapState(state);
				}
			});

			// Validate permissions
			// Save filters so we can provide a filter function later, that runs all permission filters
			let filters = [];
			for (const permission of action.permissions) {
				// Check for PermissionEvaluationHandler instead of PermissionTriple
				if (typeof permission === 'function') {
					// Permission 
					permission(data, actionContext);
				} else {
					const { filter, granted } = this.permissions.evaluate(userRole, ...permission);

					if (!granted) {
						throw new UserError(`${userRole} is not forbidden to ${permission[0]} ${permission[2]} ${permission[1]}`, 403);
					}

					filters.push(filter);
				}
			}

			// Validate data
			if (action.schema) {
				try {
					data = Joi.attempt(data, action.schema);
				} catch (e) {
					throw new UserError(e.message, 400);
				}
			}
			
			// Run action handler
			const result = await action.handler(data, actionContext);

			if (stateHasChanged) {
				this.setState(state);
			}

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