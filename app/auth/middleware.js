const autoBind = require('auto-bind');

module.exports = class AuthMiddleware {
	/**
	 * @param  {Permissions} permissions The Permissions object
	 * @return {AuthMiddleware}
	 */
	constructor(permissions) {
		this.permissions = permissions;

		autoBind(this);
	}

	/**
	 * Express handler to only let authenticated users pass.
	 *
	 * If 'next' is passed for any of the arguments,
	 * the middleware will call the next function instead
	 * of redirecting.
	 *
	 * @param {string} loggedInUrl URL to redirect to if logged in
	 * @param {string} loggedOutUrl URL to redirect to if logged out
	 */
	requireAuthentication(req, res, next) {
		if (req.isAuthenticated()) {
			next();
		} else {
			res.redirect('/login');
		}
	}

	/**
	 * Middleware to require permission to pass
	 * @param  {'create' | 'read' | 'update' | 'delete'} type 	CRUD type
	 * @param  {'any' | 'own'} scope    						Allow any or only own resources
	 * @param  {String} resource 								The resource, like 'user' or 'post'
	 * @return {ExpressHandler}
	 */
	requirePermission(type, scope, resource) {
		return (req, res, next) => {
			const permission = this.permissions.evaluate(req.user.role, type, resource, scope);

			if (permission.granted) {
				req.permission = permission;

				next();
			} else {
				// e.g.				Not allowed to update this  user 
				next(new UserError(`Not allowed to ${type} this ${resource}`, 403));
			}
		};
	}
}