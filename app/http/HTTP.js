const express = require('express');
const { createServer } = require('http');
const session = require('cookie-session')
const flash = require('connect-flash');
const bodyParser = require('body-parser');

const DynamicDashboard = require('./DynamicDashboard');
const PluginHTTPRouter = require('./PluginHTTPRouter');

// const minify = require('html-minifier').minify;

const buildErrorResponseComposer = require('@helpers/error-response-factory');
const UserError = require('@helpers/UserError');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const attachHostUrlMiddleware = require('./middleware/add-host-url');

/**
 * Initialize the main HTTP server for the mission control sysyem.
 *
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 * @return {express~Server} The express HTTP server.
 */
class HTTP {
	/**
	 * Create a HTTP server instance.
	 * 
	 * @param  {string}   sessionSecret         - The session secret used for cookies and JWT tokens
	 * @param  {object}   dependencies          - Dependency injection
	 * @param  {Config}   dependencies.config   - Mission Control config
	 * @param  {Sync}     dependencies.sync     - Sync module instance
	 * @param  {Database} dependencies.database - Active database instance
	 * @param  {Auth}     dependencies.auth     - Auth module instance
	 * @param  {Logging}  dependencies.logging  - Logging module (Logger factory)
	 */
	constructor(sessionSecret, dependencies) {
		const { config, sync, database, auth, logging } = dependencies;

		/**
		 * Mission Control Config
		 *
		 * @protected
		 * @type {Config}
		 */
		this.config = config;

		/**
		 * Auth module instance
		 *
		 * @protected
		 * @type {Auth}
		 */
		this.auth = auth;

		/**
		 * Logging module used to create Logger instances
		 *
		 * @protected
		 * @type {Logging}
		 */
		this.logging = logging;

		/**
		 * A Logger instance
		 *
		 * This is actually used for logging.
		 *
		 * @protected
		 * @type {Logger}
		 */
		this.logger = logging.createLogger('HTTP');

		/**
		 * Instance of dynamic dashboard, responsible for managing
		 * dashboard components and pages created by plugins.
		 *
		 * @type {DynamicDashboard}
		 */
		this.dashboard = new DynamicDashboard(sync);

		/**
		 * The express app
		 *
		 * @protected
		 * @type {express~Server}
		 */
		this.app = express();

		/**
		 * The Node HTTP server
		 * @type {Node~HTTP}
		 */
		this.server = createServer(this.app);

		/**
		 * [composeErrorResponse description]
		 * @type {[type]}
		 */
		this.composeErrorResponse = buildErrorResponseComposer(auth.permissions);

		// Add HTTP logging middleware to express chain.
		// Add at beginning to be able to capture response
		// timing info.
		this.app.use(logging.logMiddleware);

		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(bodyParser.json());

		// Add session to express chain
		this.app.use(session({
			name: 'mission-control',
			secret: sessionSecret
		}));
		
		// Flash messages (login errors etc)
		this.app.use(flash());

		// Add passport to express
		this.app.use(auth.passport.initialize());
		this.app.use(auth.passport.session());

		// Parse host domain from headers.
		// On every request, we add a hostUrl to the
		// request object. This can't be done statically
		// as mission-control may be used with multiple domains,
		// so instead we take the 'Host' header and validate it
		// against a list of allowed URLs so it can't be forged.
		this.app.use(attachHostUrlMiddleware(this.config));

		// Create auth router and use the routes
		this.authRouter = new express.Router();
		this.app.use(authRoutes(this.authRouter, { database, auth }));

		// Dashboard routes need component & page data attached
		this.dashboardRouter = new express.Router();

		// Bind component & page data to dashboard requests
		this.dashboardRouter.use(this.attachComponentsAndPagesMiddleware.bind(this));
		this.dashboardRouter = dashboardRoutes(this.dashboardRouter, { config, auth });
		this.app.use(this.dashboardRouter);

		// Add error handler for auth & dashboard routes.
		// We have this in a seperate function so we can call it two times.
		// 	1. After auth & dashboard routes so these have an error handler
		// 	2. After plugin initialization so plugin routes have one too
		this.addErrorHandler();
	}

	/**
	 * The main HTTP server URL
	 *
	 * @readonly
	 * @type {string}
	 */
	get url() {
		return this.config.http.url;
	}

	/**
	 * The HTTP server port
	 *
	 * @readonly
	 * @type {number}
	 */
	get port() {
		return this.config.http.port;
	}

	/**
	 * Add the event handler to the request chain.
	 *
	 * We call this after plugins have been initialized,
	 * so our error handler gets registered after their route
	 * registrations.
	 * This seems to be a limitation of express, because
	 * error handlers will not trigger for errors trown in 
	 * routes that were registered after the error handler.
	 */
	addErrorHandler() {
		this.app.use(this.onError.bind(this));
	}

	/**
	 * Express middleware to add components and pages to request.
	 * 
	 * @param  {express~Request}   req  - The express request
	 * @param  {express~Response}  res  - The express response
	 * @param  {Function}          next - Middleware callback
	 */
	attachComponentsAndPagesMiddleware(req, res, next) {
		// Attach dashboard components & pages as functions.
		// This is because not every request actually needs these
		// and it would be wasteful to evaluate them everytime.
		req.getComponentsHtml = this.dashboard.getComponentsHTML;
		req.getPagesJson = this.dashboard.getPagesJSON;

		next();
	}

	/**
	 * Global HTTP error handler
	 *
	 * @protected
	 * @param  {Error}              err  - The triggered error
	 * @param  {express~Request}    req  - Express request
	 * @param  {express~Response}   res  - Express response
	 * @param  {Function}           next - Express middleware callback
	 */
	onError(err, req, res, next) {
		// Joi packages errors in { error } format for some stupid reason
		err = err.error || err;
		
		// Joi returns weird errors so we morph them
		// into a UserError for convenience
		if (err.isJoi) {
			// Validation error => HTTP status 400 Bad Request
			err = new UserError(err.message, 400);
		}

		// If an error is NOT a UserError, that means its an internal error
		// that we haven't caught properly. These should be logged.
		if (!err.isUserError) {			
			this.logger.error('Unknown HTTP Error', { err });
		}

		// Return error status and compose JSON error response
		// @see {JSONErrorResponse}
		res.status(err.status || 500)
			.json(this.composeErrorResponse(err, req.user));
	}

	/**
	 * Create the API object used by plugins to interact with the HTTP module
	 * @param  {string} 		  pluginName - The plugin name
	 * @return {PluginHTTPRouter}           
	 */
	createHTTPPluginContext(pluginName) {
		const baseUrl = `/plugins/${pluginName}`;

		const pluginRouter = new PluginHTTPRouter(baseUrl, this.dashboard);

		// Hook the plugin router into the express app:

		// Router to use for root urls
		// example.com/:paths
		// 
		// DANGEROUS: no auth checks performed
		this.app.use(pluginRouter.root);

		// Router to use for namespaced URLs
		// example.com/plugins/example-plugin/:paths
		// 
		// SAFE: auth checks before every request handler
		this.app.use(baseUrl, this.auth.middleware.requireAuthentication, pluginRouter);

		// Router to use for namespaced URLs
		// example.com/plugins/example-plugin/:paths
		// 
		// DANGEROUS: no auth checks performed
		this.app.use(baseUrl, pluginRouter.unsafe);

		return pluginRouter;
	}

	/**
	 * Finish HTTP server setup and listen on given port 
	 */
	listen() {
		this.server.listen(this.port, () => {
			this.logger.http(`server listening on port:`, this.port);
			this.logging.logReadyMessage(this.url);
		});
	}
}


module.exports = HTTP;