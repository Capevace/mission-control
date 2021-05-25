const path = require('path');
const fs = require('fs/promises');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const logger = require('@helpers/logger').createLogger('Auth');
const crypto = require('@helpers/crypto');
const UserError = require('@helpers/UserError');


const Permissions = require('./permissions');
const AuthMiddleware = require('./middleware');
const Tokens = require('./tokens');

const grants = require('./grants');

// const initRoutes = require('./database-api');


module.exports = function initAuth(config, db, sessionSecret) {
	const api = db.api.users;

	passport.use(
		'local',
		new LocalStrategy(
				{
				usernameField: 'username',
				passwordField: 'password'
			},
			async (username, password, done) => {
				const user = await api.findUser(username);

				if (user && (await crypto.comparePassword(password, user.password))) {
					return done(null, user);
				}

				return done(null, false);
			}
		)
	);

	passport.serializeUser(function(user, cb) {
		cb(null, user.username);
	});

	passport.deserializeUser(async function(username, cb) {
		const user = await api.findUser(username);

		if (!user) return cb(null, false);

		return cb(null, user);
	});

	const permissions = new Permissions(grants);
	const tokens = new Tokens(sessionSecret);
	const middleware = new AuthMiddleware(permissions);

	return {
		passport,
		tokens,
		permissions,
		middleware,
		controllers: {
			login: {
				/**
				 * Compose the login page HTML.
				 * @return {string} The login page HTML.
				 */
				async serveLoginPage(req, res) {
					const errors = req.flash('error');
					let content = await fs.readFile(path.resolve(__dirname,'../views/login.html'));

					content = content.toString()
						.replace(
							'{{ERROR_MSG}}',
							errors.length > 0
								? `<p class="error-msg">${errors[0]}</p>`
								: ''
						)
						.replace(/\{\{URL\}\}/g, config.http.url);

					res.send(content);
				},

				/**
				 * Perform authentication and log in the user.
				 */
				performAuthentication: passport.authenticate('local', {
					failureRedirect: '/login',
					successRedirect: '/',
					failureFlash: 'Incorrect username or password.'
				}),

				/**
				 * Express handler to logout the user
				 * @param  {express.Request} req
				 * @param  {express.Response} res
				 */
				logout(req, res) {
					req.logout();

					res.redirect('/login');
				}
			}
		}
	};
};