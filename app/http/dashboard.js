const config = require('@config');
const fs = require('fs');
const path = require('path');
const readFileAsync = require('util').promisify(fs.readFile);
const express = require('express');
const addTrailingSlashMiddleware = require('@helpers/add-trailing-slash-middleware');

module.exports = function dashboardRoutes(app, requireAuth) {
	const dashboardHtmlPath = path.resolve(__dirname, '../views/dashboard.html');
	let dashboardIndexFile = '';
	try {
		dashboardIndexFile = fs
			.readFileSync(dashboardHtmlPath)
			.toString();
	} catch (e) {
		require('@helpers/log').error('HTTP:Dashboard', 'No dashboard html found at ' + dashboardHtmlPath);
	}
	

	app.get('/', requireAuth(), (req, res) => res.redirect('/dashboard/'));

	app.get('/dashboard/mobile', addTrailingSlashMiddleware, requireAuth(), async (req, res) => {
		const indexFile = (config.debug
			? (await readFileAsync(dashboardHtmlPath)).toString()
			: dashboardIndexFile
		).replace(/{{SERVER_REPLACE_API_KEY}}/gm, req.session.jwt)
		.replace(/{{SERVER_REPLACE_URL}}/gm, config.http.url)
		.replace(/index\.js/gm, 'mobile.js');

		res.set('Content-Type', 'text/html').send(indexFile);
	});

	app.use(
		'/dashboard/mobile',
		requireAuth(),
		express.static(config.dashboard.path)
	);

	app.get('/dashboard/', addTrailingSlashMiddleware, requireAuth(), async (req, res) => {
		const indexFile = (config.debug
			? (await readFileAsync(dashboardHtmlPath)).toString()
			: dashboardIndexFile
		).replace(/{{SERVER_REPLACE_API_KEY}}/gm, req.session.jwt)
			.replace(/{{SERVER_REPLACE_URL}}/gm, config.http.url);

		res.set('Content-Type', 'text/html').send(indexFile);
	});

	app.use(
		'/dashboard',
		requireAuth(),
		express.static(config.dashboard.path)
	);

	app.get('/apple-touch-icon.png', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../resources/mission-control-icon.png'));
	});

	app.get('/favicon.png', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../resources/favicon.png'));
	});
};
