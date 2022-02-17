const path = require('path');
const fs = require('fs/promises');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const logger = require('@helpers/logger').createLogger('Auth');
const crypto = require('@helpers/crypto');

const PermissionsAPI = require('./permissions');
const AuthMiddleware = require('./middleware');
const Tokens = require('./tokens');

const grants = require('./grants');

// const initRoutes = require('./database-api');

module.exports = function initAuth(core, sessionSecret) {
	const api = core.database.api.users;

	passport.use(
		'local',
		new LocalStrategy(
			{
				usernameField: 'username',
				passwordField: 'password',
			},
			async (username, password, done) => {
				const user = await api.findUnsafe(username);

				if (
					user &&
					(await crypto.comparePassword(password, user.password))
				) {
					return done(null, user);
				}

				return done(null, false, {
					message: 'Incorrect username or password.',
				});
			}
		)
	);

	// const jwtOptions = {
	// 	jwtFromRequest: fromExtractors([
	// 		cookieExtractor,
	// 		fromAuthHeaderAsBearerToken(),
	// 	]),
	// 	secretOrKey: 'secret',
	// 	issuer: 'mydomain.com',
	// 	audience: 'api.mydomain.com',
	// 	jwtCookieName: 'jwt',
	// };

	// passport.use(
	// 	'jwt',
	// 	new JwtStrategy(jwtOptions, async (jwt_payload, next) => {
	// 		const user = await api.find(jwt_payload.sub);

	// 		if (user) {
	// 			next(null, user);
	// 		} else {
	// 			next(null, false);
	// 		}
	// 	})
	// );

	passport.serializeUser(function (user, cb) {
		cb(null, user.username);
	});

	passport.deserializeUser(async function (username, cb) {
		const user = await api.find(username);

		if (!user) {
			return cb(new Error(`User ${username} not found`), null);
		}

		return cb(null, user);
	});

	const permissions = new PermissionsAPI(grants);
	const tokens = new Tokens(sessionSecret);
	const middleware = new AuthMiddleware(permissions, tokens, api);

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

					let content = await fs.readFile(
						path.resolve(__dirname, '../views/login.html')
					);

					content = content
						.toString()
						.replace(
							'{{ERROR_MSG}}',
							errors.length > 0
								? `<p class="error-msg">${errors[0]}</p>`
								: ''
						)
						.replace(/\{\{URL\}\}/g, core.config.http.url);

					res.send(content);
				},

				async authenticate(req, res, next) {
					passport.authenticate('local', (error, user, info) => {
						if (error) {
							logger.error('error during authentication', {
								error,
							});
							return next(error);
						}

						if (!user) {
							req.flash(
								'error',
								info.message || 'Oops, something went wrong'
							);

							return res.redirect('/login');
						}

						req.logIn(user, (error) => {
							if (error) {
								logger.error('error during authentication', {
									error,
								});

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
				},
			},
		},
	};
};
