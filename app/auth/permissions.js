const AccessControl = require('accesscontrol');
const autoBind = require('auto-bind');

module.exports = class Permissions {
	constructor(grants) {
		this.access = new AccessControl(grants);

		// Lock AccessControl so permissions can't be changed
		// TODO: Dynamic Permissions
		this.access.lock();

		autoBind(this);
	}

	evaluate(role, type, resource, scope = 'any') {
		return this.access.permission({
			role,
			action: `${type}:${scope}`,
			resource
		});
	}

	/**
	 * Determine role for permission check
	 * @param  {string} role [description]
	 * @return {Object}      Role API
	 */
	can(role) {
		/**
		 * Create the api object for a given CRUD type
		 *
		 * This creates an API in the following format:
		 * can('admin').update('user', 'any') // granted: true, attributes, filter
		 * can('user').update('user', 'any') // granted: false, ...
		 * can('user').update('user', 'own') // granted: true, ...
		 */
		const composeCrudHandler = (type) => {
			return (resource, scope = 'any') => {
				return permissions.evaluate(role, type, resource, scope);
			};
		};

		return {
			create: composeCrudHandler('create'),
			read: composeCrudHandler('read'),
			update: composeCrudHandler('update'),
			delete: composeCrudHandler('delete')
		};
	}
}