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
};
