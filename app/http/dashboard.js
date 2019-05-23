const config = require('@config');
const express = require('express');

module.exports = function dashboardRoutes(app, requireAuth) {
	app.get('/', requireAuth(), (req, res) => res.redirect('/dashboard'));

	app.use(
		'/dashboard',
		requireAuth(),
		express.static(config.dashboard.publicUiPath)
	);
};
