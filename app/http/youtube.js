const config = require('@config');
const fs = require('fs');
const path = require('path');
const express = require('express');
const proxy = require('express-http-proxy');

module.exports = function youtubeRoutes(app, requireAuth) {
	app.use(
		'/youtube',
		requireAuth(),
		proxy('http://localhost:3003')
	);
};
