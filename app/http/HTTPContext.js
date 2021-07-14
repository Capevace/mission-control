const express = require('express');
const autoBind = require('auto-bind');
const HTTPRouter = require('./HTTPRouter');


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
class HTTPContext extends HTTPRouter {
	/**
	 * Create a new Plugin HTTP Router instance.
	 * @param  {String}           baseURL   - The plugin URL namespace.
	 * @param  {DynamicDashboard} dashboard - Dashboard instance
	 */
	constructor(baseURL, dashboard) {
		super(baseURL);
		
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
		 * > **WARNING**: Watch out for unauthorized accesses.
		 *
		 * 
		 * @type {HTTPRouter}
		 * @public
		 * @readonly
		 */
		this.unsafeRoot = new HTTPRouter('/');

		/**
		 * Additional HTTP Router that adds routes at the root namespace ('/') instead of the plugin one.
		 * @type {HTTPRouter}
		 * @public
		 * @readonly
		 */
		this.root = new HTTPRouter('/');

		/**
		 * This log level will be used by http-proxy-middleware when used
		 * @type {'debug' | 'warn'}
		 * @public
		 */
		this.proxyLogLevel = 'warn';

		autoBind(this);
	}

	
}

module.exports = HTTPContext;