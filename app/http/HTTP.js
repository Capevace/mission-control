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

const express = require('express');
const { createServer } = require('http');
// const session = require('express-session');
const session = require('cookie-session')
// const FileStore = require('session-file-store')(session);
const flash = require('connect-flash');
const bodyParser = require('body-parser');

const DynamicDashboard = require('./DynamicDashboard');
const PluginHTTPRouter = require('./PluginHTTPRouter');

// const minify = require('html-minifier').minify;

const buildErrorResponseComposer = require('@helpers/error-response-factory');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

/**
 * Initialize the main HTTP server for the mission control sysyem.
 *
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 * @return {module:express~Server} The express HTTP server.
 */
class HTTP {
	constructor(sessionSecret, { config, sync, database, auth, logging }) {
		this.config = config;
		this.auth = auth;
		this.logging = logging;
		this.logger = logging.createLogger('HTTP');

		this.dashboard = new DynamicDashboard(sync);

		this.url = config.http.url;
		this.port = config.http.port;

		this.app = express();
		this.server = createServer(this.app);

		this.composeErrorResponse = buildErrorResponseComposer(auth.permissions);

		this.app.use(logging.logMiddleware);
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(bodyParser.json());
		// this.app.use(
		// 	session({
		// 		store: new FileStore({
		// 			path: config.basePath + '/session',
		// 			secret: sessionSecret,
		// 			logFn: logging.debug,
		// 		}),
		// 		secret: sessionSecret,
		// 		resave: false,
		// 		saveUninitialized: false,
		// 		name: 'mc.sid',
		// 		cookie: {
		// 			httpOnly: true,
		// 			maxAge: 1000 * 60 * 60 * 24 * 365, // sessions are active for a year
		// 		},
		// 	})
		// );
		this.app.use(session({
			name: 'mission-control',
			secret: sessionSecret
		}))
		this.app.use(flash());

		this.app.use(auth.passport.initialize());
		this.app.use(auth.passport.session());

		// Parse host domain from headers
		this.app.use(this.onRequest.bind(this));
		this.app.use(this.onError.bind(this));

		this.authRouter = new express.Router();
		this.app.use(authRoutes(this.authRouter, { database, auth }));

		// Dashboard routes need component & page data attached
		this.dashboardRouter = new express.Router();
		this.dashboardRouter.use(this.onDashboardRequest.bind(this));
		this.dashboardRouter = dashboardRoutes(this.dashboardRouter, { config, auth });
		this.app.use(this.dashboardRouter);
	}

	onRequest(req, res, next) {
		req.hostUrl = this.config.http.allowedDomains.includes(req.headers['host'])
			? req.protocol + '://' + req.headers['host']
			: this.config.http.url;

		next();
	}

	onDashboardRequest(req, res, next) {
		// Attach dashboard components
		req.componentsHtml = this.dashboard.getComponentsHTML;
		req.pagesJson = this.dashboard.getPagesJSON;
		req.state = Object.freeze(this.dashboard.state);

		next();
	}

	onError(err, req, res, next) {
		if (!err.isUserError) {			
			this.logger.error('Unknown HTTP Error', { err });
		}

		res.status(err.status || 500)
			.json(this.composeErrorResponse(err, req.user));
	}

	createHTTPPluginContext(pluginName) {
		const baseUrl = `/plugins/${pluginName}`;

		const pluginRouter = new PluginHTTPRouter(baseUrl, this.dashboard);

		this.app.use(baseUrl, this.auth.middleware.requireAuthentication, pluginRouter);
		this.app.use(pluginRouter.root);

		this.app.use(baseUrl, pluginRouter.unsafe);

		return pluginRouter;
	}

	listen() {
		this.server.listen(this.port, () => {
			this.logger.http(`server listening on port:`, this.port);
			this.logging.logReadyMessage(this.url);
		});
	}
}


module.exports = HTTP;