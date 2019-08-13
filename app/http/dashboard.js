const config = require('@config');
const fs = require('fs');
const readFileAsync = require('util').promisify(fs.readFile);
const express = require('express');
const addTrailingSlashMiddleware = require('@helpers/add-trailing-slash-middleware');

module.exports = function dashboardRoutes(app, requireAuth) {
	let dashboardIndexFile = '';
	try {
		dashboardIndexFile = fs
			.readFileSync(config.dashboard.path + '/dashboard.html')
			.toString();
	} catch (e) {
		require('@helpers/log').error('HTTP:Dashboard', 'No dashboard html found at ' + config.dashboard.path + '/dashboard.html');
	}
	

	app.get('/', requireAuth(), (req, res) => res.redirect('/dashboard/'));

	app.get('/dashboard/', addTrailingSlashMiddleware, requireAuth(), async (req, res) => {
		console.log()
		const indexFile = (config.debug
			? (await readFileAsync(config.dashboard.path + '/dashboard.html')).toString()
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
