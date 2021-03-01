/**
 * ### The HTTP Server
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 *
 * The socket server might be better for your implementation.
 *
 * @see {@link module:@socket}
 * @module @http
 * @requires express
 * @requires express-session
 * @requires passport
 * @requires querystring
 */

const config = require('@config');
const database = require('@database');
const logger = require('@helpers/logger');

const express = require('express');
const app = express();
const server = require('http').createServer(app);

const session = require('express-session');
const passport = require('passport');
const queryString = require('querystring');
const proxy = require('http-proxy-middleware');

const uuid = require('uuid/v4');

const authRoutes = require('./auth');
const stateRoutes = require('./state');
const dashboardRoutes = require('./dashboard');

/**
 * Initialize the main HTTP server for the mission control sysyem.
 *
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 * @return {module:express~Server} The express HTTP server.
 */
module.exports = function http() {
	let sessionSecret = database.get('session-secret', null);

	if (!sessionSecret) {
		sessionSecret = uuid();
		database.set('session-secret', sessionSecret);
	}

	app.use(
		session({
			secret: sessionSecret,
			resave: true,
			saveUninitialized: true,
			name: 'mc.sid'
		})
	);

	app.use(logger.logMiddleware);

	// Parse host domain from headers
	app.use((req, res, next) => {		
		req.hostUrl = config.http.allowedDomains.includes(req.headers['host'])
			? req.protocol + '://' + req.headers['host']
			: config.http.url;

		next();
	});

	const requireAuthentication = () => (req, res, next) => {
		passport.authenticate('jwt', {
			session: false,
			failureRedirect:
				'/auth/login?' +
				queryString.stringify({ redirect_url: req.originalUrl })
		})(req, res, next);
	};

	authRoutes(app, requireAuthentication);
	stateRoutes(app, requireAuthentication);
	dashboardRoutes(app, requireAuthentication);

	return {
		server,
		createRouter(pluginName) {
			const baseUrl = `/plugins/${pluginName}`;

			const rawRouter = makeRouter('');
			const unsafeRouter = makeRouter(baseUrl);

			const router = makeRouter(baseUrl);
			router.noAuth = unsafeRouter; // Router for routes that don't use auth
			router.raw = rawRouter; // Router for routes that start at URL root. Useful for pretty URLs
		
			app.use(rawRouter);
			app.use(baseUrl, unsafeRouter);
			app.use(baseUrl, requireAuthentication(), router);

			return router;
		}
	};
};

function makeRouter(baseUrl) {
	const router = express.Router();
	router.baseUrl = baseUrl;

	/**
	 * Proxy an HTTP route to another target URL.
	 * This is useful if you want to proxy something through mission-control auth.
	 */
	router.proxy = function _proxy(route, target, options = {}) {
		router.use(
			route,
			proxy(
				'/',
				{
					target,
					logLevel: config.debug ? 'debug' : 'warn',
					ws: true,
					pathRewrite: {
						[`^${route}`]: '/',
						[`^${route}/`]: '/'
					},
					...options
				}
			)
		);
	};

	return router;
}