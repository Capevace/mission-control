const config = require('@config');
const fs = require('fs');
const readFileAsync = require('util').promisify(fs.readFile);
const express = require('express');

module.exports = function dashboardRoutes(app, requireAuth) {
	let dashboardIndexFile = '';
	try {
		dashboardIndexFile = fs
			.readFileSync(config.dashboard.path + '/index.html')
			.toString();
	} catch (e) {
		require('@helpers/log').error('HTTP:Dashboard', 'No dashboard html found at ' + config.dashboard.path + '/index.html');
	}
	

	app.get('/', requireAuth(), (req, res) => res.redirect('/dashboard'));

	app.get('/dashboard', requireAuth(), async (req, res) => {
		const indexFile = (config.debug
			? await readFileAsync(config.dashboard.path + '/index.html')
			: dashboardIndexFile
		).replace(/{{SERVER_REPLACE_API_KEY}}/gm, req.session.jwt);

		res.set('Content-Type', 'text/html').send(indexFile);
	});

	app.use(
		'/dashboard',
		requireAuth(),
		express.static(config.dashboard.path)
	);
};
