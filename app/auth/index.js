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
				const user = await api.findUnsafe(username);

				if (user && (await crypto.comparePassword(password, user.password))) {
					return done(null, user);
				}

				return done(null, false, { message: 'Incorrect username or password.' });
			}
		)
	);

	passport.serializeUser(function(user, cb) {
		cb(null, user.username);
	});

	passport.deserializeUser(async function(username, cb) {
		const user = await api.find(username);

		if (!user) {
			return cb(new Error(`User ${username} not found`), null);
		}

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

				authenticate(req, res, next) {
					passport.authenticate('local', (error, user, info) => {
						if (error) { 
							logger.error('error during authentication', { error });
							return next(error);
						}
						
						if (!user) { 
							req.flash('error', info.message || 'Oops, something went wrong');
							
							return res.redirect('/login');
						}

						req.logIn(user, (error) => {
							if (error) { 
								logger.error('error during authentication', { error });

								return next(error);
							}

							return res.redirect('/');
						});
					})(req, res, next);
				},

				/**
				 * Express handler to logout the user
				 * @param  {express.Request} req
				 * @param  {express.Response} res
				 */
				logout(req, res, next) {
					req.logOut();

					next();
				}
			}
		}
	};
};