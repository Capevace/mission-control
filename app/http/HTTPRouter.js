const express = require('express');
const proxy = require('http-proxy-middleware');

module.exports = class HTTPRouter extends express.Router {
	constructor(baseURL) {
		super();

		/**
		 * The base URL for the default plugin router.
		 * @type {String}
		 */
		this.baseURL = baseURL;
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
};
