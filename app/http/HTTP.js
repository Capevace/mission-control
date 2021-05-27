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
const logging = require('@helpers/logger');

const express = require('express');
const { createServer } = require('http');

const session = require('express-session');
const FileStore = require('session-file-store')(session);
const proxy = require('http-proxy-middleware');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const passport = require('passport');
const fs = require('fs');

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
		this.server = createServer(app);

		this.composeErrorResponse = buildErrorResponseComposer(auth.permissions);

		app.use(logging.logMiddleware);
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json());
		app.use(
			session({
				store: new FileStore({
					path: config.basePath + '/session',
					secret: sessionSecret,
					logFn: logging.debug,
				}),
				secret: sessionSecret,
				resave: false,
				saveUninitialized: false,
				name: 'mc.sid',
				cookie: {
					httpOnly: true,
					maxAge: 1000 * 60 * 60 * 24 * 365, // sessions are active for a year
				},
			})
		);
		app.use(flash());

		app.use(passport.initialize());
		app.use(passport.session());

		// Parse host domain from headers
		app.use(this.onRequest);
		app.use(this.onError);

		
		this.authRouter = new express.Router();
		app.use(authRoutes(this.authRouter, { database, auth }));

		// Dashboard routes need component & page data attached
		this.dashboardRouter = new express.Router();
		dashboardRouter.use(this.onDashboardRequest);
		app.use(dashboardRoutes(dashboardRouter, auth));
	}

	onRequest(req, res, next) {
		req.hostUrl = this.config.http.allowedDomains.includes(req.headers['host'])
			? req.protocol + '://' + req.headers['host']
			: config.http.url;

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

	composePluginContext(pluginName) {
		const baseUrl = `/plugins/${pluginName}`;

		const pluginRouter = new PluginHTTPRouter(baseUrl, this.dashboard);

		app.use(pluginRouter);
		app.use(baseUrl, pluginRouter.unsafe);
		app.use(baseUrl, this.auth.middleware.requireAuthentication, pluginRouter.root);

		return pluginRouter;
	}

	listen() {
		this.server.listen(this.port, () => {
			this.logger.http(`server listening on port:`, this.port);
			this.logging.logReadyMessage(this.url);
		});
	}
}

class DynamicDashboard {
	constructor(sync) {
		this.sync = sync;
		
		this.components = {};
		this.pages = {};
	}

	get state() {
		return Object.freeze(this.sync.state);
	}

	getComponentsHTML() {
		return Object.values(this.components)
			.map((component) => `<!-- ${component.name} COMPONENT HTML -->
				${component.contentFn ? component.contentFn() : component.content}
			`)
			.reduce((fullHTML, html) => fullHTML + html, '');
	}

	getPagesJSON() {
		return JSON.stringify(Object.values(this.pages));
	}

	createComponent(name, vueFilePath = null) {
		if (name in this.components)
			throw new Error(`Component ${name} already exists`);

		// return component builder
		this.components[name] = {
			name,
			vueFilePath
		};

		return {
			vue: (vueFilePath) => {
				this.components[name].vueFilePath = vueFilePath;

				// Read from FS
				// ? Compile
			}
		};
	}

	createPage(url, title) {
		if (url in this.pages)
			throw new Error(`Page at ${url} was already registered`);

		this.dashboard.pages[url] = {
			name,
			content: null,
			options: {}
		};

		const builder = {
			vue: (vueFilePath) => {
				const absolutePath = path.resolve(this.pluginPath, vueFilePath);

				this.pages[url].content = {
					type: 'vue',
					path: absolutePath,
					raw: fs.readFileSync(absolutePath)
				};

				// Read from FS
				// ? Compile

				return builder;
			},

			html: (htmlFilePath) => {
				const absolutePath = path.resolve(this.pluginPath, htmlFilePath);
				
				this.pages[url].content = {
					type: 'html',
					path: absolutePath,
					raw: fs.readFileSync(absolutePath)
				};

				return builder;
			}	
		};
		return builder;
	}
}

class PluginHTTPRouter extends express.Router {
	constructor(baseURL, dashboard) {
		super();

		this.baseURL = baseURL;
		this.dashboard = dashboard;

		this.unsafe = new express.Router();
		this.unsafe.baseURL = baseURL;

		this.root = new express.Router();
		this.root.baseURL = '/';

		autoBind(this);
	}

	/**
	 * Proxy an HTTP route to another target URL.
	 * This is useful if you want to proxy something through mission-control auth.
	 */
	proxy(route, target, options = {}) {
		this.use(
			route,
			proxy('/', {
				target,
				logLevel: config.debug ? 'debug' : 'warn',
				ws: true,
				pathRewrite: {
					[`^${route}`]: '/',
					[`^${route}/`]: '/',
				},
				...options,
			})
		);

		return this;
	}

	
	component(name, vueFilePath = null) {
		return this.dashboard.createComponent(name, vueFilePath);
	}

	page() {
		

		
	}
}