const config = require('@config');
const fs = require('fs');
const path = require('path');
const express = require('express');
const addTrailingSlashMiddleware = require('@helpers/add-trailing-slash-middleware');

const dashboardHtmlPath = path.resolve(__dirname, '../views/dashboard.html');
const dashboardHtml = fs.readFileSync(dashboardHtmlPath)
	.toString()
	.replace(/{{SERVER_REPLACE_URL}}/gm, config.http.url);

// HTML for the mobile dashboard (uses JS optimized for old iOS Safari)
const dashboardHtmlMobile = dashboardHtml
	.replace(/index\.js/gm, 'mobile.js')
	.replace('<!--DELETE-MOBILE', '')
	.replace('DELETE-MOBILE-->', '');

function renderDashboard(mobile = false) {
	return async (req, res) => {
		const html = (mobile ? dashboardHtmlMobile : dashboardHtml)
			.replace(/{{SERVER_REPLACE_API_KEY}}/gm, req.session.jwt)
			.replace(/{{SERVER_ISSUED_VUE_COMPONENTS}}/, '');

		res.set('Content-Type', 'text/html').send(html);
	};
}

module.exports = function dashboardRoutes(app, requireAuth) {
	// Dashboard HTML routes
	app.get('/', addTrailingSlashMiddleware, requireAuth(), renderDashboard(false));
	app.get('/mobile', addTrailingSlashMiddleware, requireAuth(), renderDashboard(true));

	// Redirect old dashboard routes
	app.get('/dashboard', requireAuth(), (req, res) => res.redirect('/'));
	app.get('/dashboard/mobile', requireAuth(), (req, res) => res.redirect('/mobile'));

	// JS & CSS Assets
	app.use('/assets', requireAuth(), express.static(config.dashboard.path));

	app.get('/apple-touch-icon.png', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../resources/mission-control-icon.png'));
	});

	app.get('/favicon.png', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../resources/favicon.png'));
	});
};
