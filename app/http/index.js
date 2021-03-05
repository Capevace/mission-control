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

/**
 * Initialize the main HTTP server for the mission control sysyem.
 *
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 * @return {module:express~Server} The express HTTP server.
 */
module.exports = function http(database, auth, sessionSecret) {
	const app = express();
	const server = createServer(app);

	let components = {};

	app.use(logger.logMiddleware);
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(
		session({
			store: new FileStore({
				path: config.basePath + '/session',
				secret: sessionSecret,
			}),
			secret: sessionSecret,
			resave: true,
			saveUninitialized: true,
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

	app.use((req, res, next) => {
		// Attach dashboard components
		req.componentsHtml = () => {
			let html = Object.values(components)
				.map((component) => `<!-- ${component.name} COMPONENT HTML -->
					${component.contentFn ? component.contentFn() : component.content}
				`)
				.reduce((html, component) => html + component, '');

			return html;

			// return minify(html, {
			// 	minifyJS: true,
			// 	minifyCSS: true
			// });
		};

		next();
	});

	app.use(authRoutes(new express.Router(), auth));
	app.use(stateRoutes(new express.Router(), auth));
	app.use(dashboardRoutes(new express.Router(), auth));

	const context = {
		server,
		composeAPIContext(pluginName) {
			const baseUrl = `/plugins/${pluginName}`;

			const getComponents = {
				get() {
					return components;
				},
				set(name, component) {
					components[name] = component;
				}
			};

			const rawRouter = composeAPIContextFromRouter(getComponents, '');
			const unsafeRouter = composeAPIContextFromRouter(getComponents, baseUrl);

			const router = composeAPIContextFromRouter(getComponents, baseUrl);
			router.noAuth = unsafeRouter; // Router for routes that don't use auth
			router.raw = rawRouter; // Router for routes that start at URL root. Useful for pretty URLs
		
			app.use(rawRouter);
			app.use(baseUrl, unsafeRouter);
			app.use(baseUrl, auth.authenticate, router);

			return router;
		}
	};

	return context;
};

function composeAPIContextFromRouter(components, baseUrl) {
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

	router.addComponent = (name, htmlContent) => {
		components.set(name, {
			name,
			content: htmlContent
		});
	};

	router.addComponentFile = (name, filePath) => {
		components.set(name, {
			name,
			contentFn: () => fs.readFileSync(filePath).toString(),
			content: fs.readFileSync(filePath).toString()
		});
	};

	router.addComponentScript = (name, scriptContent) => {
		router.registerComponent(`
			<script>
				${scriptContent}
			</script>
		`, name);
	};

	return router;
}