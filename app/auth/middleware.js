const autoBind = require('auto-bind');

const UserError = require('@helpers/UserError');

module.exports = class AuthMiddleware {
	/**
	 * @param  {PermissionsAPI} permissions The PermissionsAPI object
	 * @return {AuthMiddleware}
	 */
	constructor(permissions) {
		this.permissions = permissions;

		autoBind(this);
	}

	/**
	 * Express middleware to only let authenticated users pass.
	 *
	 * If 'next' is passed for any of the arguments,
	 * the middleware will call the next function instead
	 * of redirecting.
	 *
	 * @param {Request}  req  - Request
	 * @param {Response} res  - Response
	 * @param {Function} next - Next callback
	 */
	requireAuthentication(req, res, next) {
		if (req.isAuthenticated()) {
			next();
		} else {
			res.redirect('/login');
		}
	}

	/**
	 * Express handler to only let UNauthenticated users pass (ie. not logged in).
	 *
	 * @param {Request}  req  - Request
	 * @param {Response} res  - Response
	 * @param {Function} next - Next callback
	 */
	onlyUnauthenticated(req, res, next) {
		if (req.isAuthenticated()) {
			res.redirect('/');
		} else {
			next();
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
			const permission = this.permissions.evaluate(
				req.user.role,
				type,
				resource,
				scope
			);

			if (permission.granted) {
				req.permission = permission;

				next();
			} else {
				// e.g.				Not allowed to update this  user
				next(
					new UserError(
						`Not allowed to ${type} this ${resource}`,
						403
					)
				);
			}
		};
	}
};
