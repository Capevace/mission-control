const fs = require('fs');
const path = require('path');
const express = require('express');
const addTrailingSlashMiddleware = require('@helpers/add-trailing-slash-middleware');

module.exports = function dashboardRoutes(app, { config, auth }) {
	const dashboardHtmlPath = path.resolve(__dirname, '../../views/dashboard.html');
	const dashboardHtml = fs.readFileSync(dashboardHtmlPath)
		.toString()
		.replace(/{{SERVER_REPLACE_URL}}/gm, config.http.url);

	// HTML for the mobile dashboard (uses JS optimized for old iOS Safari)
	const dashboardHtmlMobile = dashboardHtml
		.replace(/index\.js/gm, 'mobile.js')
		.replace('<!--DELETE-MOBILE', '')
		.replace('DELETE-MOBILE-->', '');

	function renderDashboard(mobile = false, generateAPIToken) {
		return (req, res) => {
			const html = (mobile ? dashboardHtmlMobile : dashboardHtml)
				.replace(/{{SERVER_REPLACE_API_KEY}}/gm, generateAPIToken(req.user))
				.replace(/{{SERVER_REPLACE_USER_JSON}}/, JSON.stringify({ ...req.user, password: undefined }))
				.replace(/{{SERVER_REPLACE_DASHBOARD_DATA}}/, req.getComponentsHtml())
				.replace(/{{SERVER_REPLACE_PAGES_JSON}}/, req.getPagesJson())
				.replace(/{{SERVER_REPLACE_COMPONENTS_DICT}}/, req.getComponents());

			res.set('Content-Type', 'text/html').send(html);
		};
	}

	// Dashboard HTML routes
	app.get('/', auth.middleware.requireAuthentication, renderDashboard(false, auth.tokens.generate));
	app.get('/mobile', addTrailingSlashMiddleware, auth.middleware.requireAuthentication, renderDashboard(true, auth.tokens.generate));

	// Redirect old dashboard routes
	app.get('/dashboard', auth.middleware.requireAuthentication, (req, res) => res.redirect('/'));
	app.get('/dashboard/mobile', auth.middleware.requireAuthentication, (req, res) => res.redirect('/mobile'));

	// JS & CSS Assets
	app.use('/assets', express.static(config.dashboard.path));
	app.use('/resources', express.static(path.resolve(__dirname, '../../../resources')));

	app.get('/apple-touch-icon.png', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../../resources/apple-touch-icon.png'));
	});

	app.get('/favicon.png', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../../resources/favicon.png'));
	});

	return app;
};
