const AccessControl = require('accesscontrol');
const autoBind = require('auto-bind');

/**
 * Class responsible for evaluation role-based permissions
 */
class Permissions {
	constructor(grants) {
		this.access = new AccessControl(grants);

		// Lock AccessControl so permissions can't be changed
		// TODO: Lock dynamic permissions
		// this.access.lock();

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
				return this.evaluate(role, type, resource, scope);
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

/**
 * Crud actions for permissions
 * @readonly
 * @enum {string}
 */
Permissions.CRUD = {
	/** User allowed to create a resource */
	create: 'create',

	/** User allowed to read a resource */
	read: 'read',

	/** User allowed to update a resource */
	update: 'update',

	/** User allowed to delete a resource */
	delete: 'delete'
};

/**
 * Permission scopes
 * @readonly
 * @enum {string}
 */
Permissions.Scope = {
	/** User allowed to access any resource */
	any: 'any',

	/** User allowed to access their own resources */
	own: 'own'
};

/**
 * Array data structure for permissions
 * @typedef {Array<Permissions.CRUD | String | Permissions.Scope>} PermissionTriple
 */

module.exports = Permissions;