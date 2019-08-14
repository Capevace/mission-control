const config = require('@config');
const fs = require('fs');
const path = require('path');
const express = require('express');
const proxy = require('express-http-proxy');

module.exports = function dashboardRoutes(app, requireAuth) {
	app.use(
		'/files',
		requireAuth(),
		proxy('http://localhost:3002', {
			proxyReqOptDecorator(proxyReqOpts, req) {
				proxyReqOpts.headers['X-Files-Auth'] = req.user.id;
				return proxyReqOpts;
			}
		})
	);
};
