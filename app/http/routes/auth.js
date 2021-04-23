const logging = require('@helpers/logger');
const logger = logging.createLogger('Auth');

const passport = require('passport');
const jwt = require('jsonwebtoken');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const queryString = require('querystring');
const proxy = require('http-proxy-middleware');

const User = require('@database/models/User');
const UserError = require('@http/UserError');

/*
	How the auth system works
	=========================

	We have a SSO server that we redirect to, if we are not logged in.
	That server, on a successful login, returns a JSON Web Token (JWT).

	It will then redirect us back to the page we came from which is specified in
	the querystring ('redirect_url') of the first request to the SSO server.

	In this server, we will then get that jwt that was also passed as a querystring ('auth_token')
	and verify it with the same key the SSO server used to sign the token.

	If this verification is successful, we add the JWT to the session object.

	When we now try to access a resource, that is protected by passport, the passport JWTStrategy 
	will kick in. The JWTStrategy checks the session object for the JWT. If there is one present,
	it will get verified. When that is successful and the token has not expired, 
	it lets the request pass.
*/

module.exports = function authRoutes(app, auth) {
	app.get('/login', auth.controller.serveLoginPage);
    app.post('/login', auth.controller.performAuthentication);

	app.get('/logout', (req, res) => {
		req.logout();
		// req.session.destroy();

		res.redirect('/login');
	});

	app.get('/users/:username', (req, res) => {
		console.log(req.params);
		const username = String(req.params.username);
		const user = User.validate({});
		console.log(user);

		// next(new Error('wat'));
		
		// try {
		// 	await auth.controller.updateUser(user, username);
		// 	res.json({});
		// } catch (e) {

		// }
		// logger.info(`Updating User ${username}`, user);

		// if (!auth.permissions.canEditUser(req.user, username)) {
		// 	return res.status(401).json({
		// 		error: {
		// 			status: 401,
		// 			message: 'Not allowed to edit user data'
		// 		}
		// 	});
		// }

		// if (username !== user.username) {
		// 	// Set username
		// 	await database.api.users.updateUsername(username, user.username);
		// }

		// // TODO: Better permission-based password changes
		// // Right now we only check if the current user is the same that's
		// // trying to change the thing.

		// // If the password is changed, update (and hash) the password
		// if (user.password) {
		// 	// Check if user is allowed to change this users password
		// 	// User can only change password, if he is that user or an admin.
		// 	if (
		// 		req.user.role === 'guest' 
		// 		|| (
		// 			username !== req.user.username 
		// 			&& req.user.role !== 'admin'
		// 		)
		// 	) {
		// 		return res.status(401).json({
		// 			error: {
		// 				status: 401,
		// 				message: 'Not allowed to change username'
		// 			}
		// 		});
		// 	}

		// 	// Update password
		// 	database.api.users.updatePassword(username, user.password);
		// }

		// // TODO: DONT DO THIS, FIGURE OUT HOW TO DO THIS CLEANLY!
		// // Events? Private user state?
		// database.api.users.update(username, user);

		// res.json({
		// 	error: null
		// });
	});



	return app;
};
