const config = require('@config');
const log = require('@helpers/log').logger('HTTP');

const express = require('express');
const app = express();
const server = require('http').createServer(app);

const session = require('express-session');
const passport = require('passport');
const queryString = require('querystring');

const authRoutes = require('./auth');
const stateRoutes = require('./state');
const spotifyRoutes = require('./spotify');
const iftttRoutes = require('./ifttt');
const dashboardRoutes = require('./dashboard');

/*
 * This function initializes the main HTTP server for the mission control sysyem.
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 */
module.exports = function http() {
	app.use(
		session({
			secret: config.http.sessionSecret,
			resave: true,
			saveUninitialized: true,
			name: 'mc.sid'
		})
	);

	const requireAuthentication = () => (req, res, next) => {
		passport.authenticate('jwt', {
			session: false,
			failureRedirect:
				'/auth/login?' +
				queryString.stringify({ redirect_url: req.originalUrl })
		})(req, res, next);
	};

	authRoutes(app, requireAuthentication);
	stateRoutes(app, requireAuthentication);
	spotifyRoutes(app, requireAuthentication);
	iftttRoutes(app, requireAuthentication);
	dashboardRoutes(app, requireAuthentication);

	server.listen(config.http.port, () =>
		log(`Listening on port ${config.http.port}.`)
	);

	return server;
};
