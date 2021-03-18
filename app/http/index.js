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
const logger = require('@helpers/logger');

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

const authRoutes = require('./routes/auth');
const stateRoutes = require('./routes/state');
const dashboardRoutes = require('./routes/dashboard');

const addPluginDashboardComponentsMiddleware = require('./middleware/plugin-dashboard-components');

/**
 * Initialize the main HTTP server for the mission control sysyem.
 *
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 * @return {module:express~Server} The express HTTP server.
 */
module.exports = function http(state, database, auth, sessionSecret) {
	const app = express();
	const server = createServer(app);

	let components = {};
	let pages = {};

	app.use(logger.logMiddleware);
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(
		session({
			store: new FileStore({
				path: config.basePath + '/session',
				secret: sessionSecret,
				logFn: logger.debug
			}),
			secret: sessionSecret,
			resave: false,
			saveUninitialized: false,
			name: 'mc.sid',
			cookie: {
				httpOnly: true,
				maxAge: 1000 * 60 * 60 * 24 * 365 // sessions are active for a year
			}
		})
	);
	app.use(flash());

	app.use(passport.initialize());
	app.use(passport.session());

	// Parse host domain from headers
	app.use((req, res, next) => {		
		req.hostUrl = config.http.allowedDomains.includes(req.headers['host'])
			? req.protocol + '://' + req.headers['host']
			: config.http.url;

		next();
	});

	app.use(authRoutes(new express.Router(), auth));
	app.use(stateRoutes(new express.Router(), auth));

	const dashboardRouter = new express.Router();

	// Dashboard routes need component & page data attached
	dashboardRouter.use(
		addPluginDashboardComponentsMiddleware(
			() => ({ components, pages }), 
			state.getState
		)
	);

	app.use(dashboardRoutes(dashboardRouter, auth));

	const context = {
		server,
		composeAPIContext(pluginName) {
			const baseUrl = `/plugins/${pluginName}`;

			const localContext = {
				components: {
					get() {
						return components;
					},
					set(name, component) {
						components[name] = component;
					}
				},
				pages: {
					get() {
						return pages;
					},
					set(name, page) {
						pages[name] = page;
					}
				}
			};

			const rawRouter = composeAPIContextFromRouter(localContext, '');
			const unsafeRouter = composeAPIContextFromRouter(localContext, baseUrl);

			const router = composeAPIContextFromRouter(localContext, baseUrl);
			router.noAuth = unsafeRouter; // Router for routes that don't use auth
			router.raw = rawRouter; // Router for routes that start at URL root. Useful for pretty URLs
		
			app.use(rawRouter);
			app.use(baseUrl, unsafeRouter);
			app.use(baseUrl, auth.authenticateRequest, router);

			return router;
		}
	};

	return context;
};

function composeAPIContextFromRouter({ components, pages }, baseUrl) {
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

	router.addComponent = (name, htmlContent, contentFn = null) => {
		components.set(name, {
			name,
			contentFn,
			content: htmlContent
		});
	};

	router.addComponentFile = (name, filePath) => {
		const getFile = () => fs.readFileSync(filePath).toString();

		router.addComponent(
			name, 
			getFile(),
			getFile
		);
	};

	router.addComponentScript = (name, scriptContent) => {
		router.registerComponent(`
			<script>
				${scriptContent}
			</script>
		`, name);
	};

	router.addPage = (url, title, componentName, options = {}) => {
		pages.set(url, {
			url,
			title,
			componentName,
			menuExact: options.exact,
			menu: options.menu,
			icon: options.icon
		});
	};

	return router;
}