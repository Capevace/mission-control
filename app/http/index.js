/**
 * ### The HTTP Server
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 *
 * The socket server might be better for your implementation.
 *
 * @see {@link module:@socket}
 * @module @http
 * @requires express
 * @requires express-session
 * @requires passport
 * @requires querystring
 */

const config = require('@config');
const database = require('@database');
const logging = require('@helpers/log');
const log = logging.logger('HTTP', 'magenta');

const express = require('express');
const app = express();
const server = require('http').createServer(app);

const session = require('express-session');
const passport = require('passport');
const queryString = require('querystring');

const uuid = require('uuid/v4');

const authRoutes = require('./auth');
const stateRoutes = require('./state');
const spotifyRoutes = require('./spotify');
const iftttRoutes = require('./ifttt');
const dashboardRoutes = require('./dashboard');
const filesRoutes = require('./files');
const youtubeRoutes = require('./youtube');

/**
 * Initialize the main HTTP server for the mission control sysyem.
 *
 * All HTTP communications run through this server, although third-party dependencies
 * might still create their own HTTP servers.
 * @return {module:express~Server} The express HTTP server.
 */
module.exports = function http() {
	let sessionSecret = database.get('session-secret', null);

	if (!sessionSecret) {
		sessionSecret = uuid();
		database.set('session-secret', sessionSecret);
	}


	app.use(
		session({
			secret: sessionSecret,
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
	filesRoutes(app, requireAuthentication);
	youtubeRoutes(app, requireAuthentication);

	server.listen(config.http.port, () => {
		log(`HTTP server listening on port ${config.http.port}`);
		logging.logReadyMessage(config.http.url, config.auth.url);
	});

	return server;
};
