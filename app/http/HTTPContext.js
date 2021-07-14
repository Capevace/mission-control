const express = require('express');
const autoBind = require('auto-bind');
const proxy = require('http-proxy-middleware');


/**
 * The HTTP API for plugins and an HTTP router.
 *
 * This class is used by plugins to create http routes. 
 * HTTP requests will be automatically checked for authentication.
 * The URLs have a unique plugin prefix (/plugins/example-plugin/...).
 *
 * There are two additional routers, one to place URLs at the root namespace,
 * and one at plugin namespace that doesn't check for authentication.
 */
class HTTPContext extends express.Router {
	/**
	 * Create a new Plugin HTTP Router instance.
	 * @param  {String}           baseURL   - The plugin URL namespace.
	 * @param  {DynamicDashboard} dashboard - Dashboard instance
	 */
	constructor(baseURL, dashboard) {
		super();

		/**
		 * The base URL for the default plugin router.
		 * @type {String}
		 */
		this.baseURL = baseURL;

		/**
		 * The dynamic dashboard instance to manage components and pages.
		 * @type {DynamicDashboard}
		 */
		this.dashboard = dashboard;

		/**
		 * Additional HTTP Router that will not be checked by authentication.
		 *
		 * Routes will be placed after the plugin URL namespace (/plugins/example-plugin/YOUR-ROUTES...).
		 * For example for public APIs or something.
		 *
		 * Watch out for unauthorized accesses.
		 *
		 * 
		 * @type {express.Router}
		 * @public
		 * @readonly
		 */
		this.unsafe = new express.Router();
		this.unsafe.baseURL = baseURL;

		/**
		 * Additional HTTP Router that adds routes at the root namespace ('/') instead of the plugin one.
		 * @type {express.Router}
		 * @public
		 * @readonly
		 */
		this.root = new express.Router();
		this.root.baseURL = '/';

		/**
		 * This log level will be used by http-proxy-middleware when used
		 * @type {'debug' | 'warn'}
		 * @public
		 */
		this.proxyLogLevel = 'warn';

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
				logLevel: this.proxyLogLevel,
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
}

module.exports = HTTPContext;