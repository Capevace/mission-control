const autoBind = require('auto-bind');
const { promisify } = require('util');

const UserError = require('@helpers/UserError');

module.exports = class AuthMiddleware {
	/**
	 * @param  {PermissionsAPI} permissions
	 * @param  {TokensAPI} 		tokens
	 * @param  {UsersAPI} 		api
	 * @return {AuthMiddleware}
	 */
	constructor(permissions, tokens, api, logging) {
		this.permissions = permissions;
		this.tokens = tokens;
		this.api = api;
		this.logger = logging.createLogger('Auth');

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
	async requireAuthentication(req, res, next) {
		try {
			if (req && req.cookies && 'access_token' in req.cookies) {
				try {
					const token = req.cookies['access_token'];

					const username = this.tokens.verifyCaddyJWT(token, 'a3c6eeee16e4479e9f31786e30b3ebdc');
					const user = await this.api.find(username);

					const logIn = promisify(req.logIn.bind(req));
					await logIn(user);

					this.logger.debug('authenticated user via Caddy JWT', user);
				} catch (e) {
					this.logger.warn('invalid jwt token', e);
				}
			} 

			if (req.isAuthenticated()) {
				next();
			} else {
				res.redirect('/login');
			}
		} catch (e) {
			this.logger.error('TEST ERR', e);
			return next(e);
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
