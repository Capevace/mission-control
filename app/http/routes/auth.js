const logging = require('@helpers/logger');
const logger = logging.createLogger('Auth');

const passport = require('passport');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const queryString = require('querystring');
const proxy = require('http-proxy-middleware');

const User = require('@models/User');
const UserError = require('@helpers/UserError');
const validator = require('@http/middleware/validator');

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

module.exports = function authRoutes(app, { auth, database: db }) {
	
	app.get('/login', auth.controllers.login.serveLoginPage);
    // app.post('/login', passport.authenticate('local', { 
    // 	successRedirect: '/',
    // 	failureRedirect: '/login',
    // 	failureFlash: true
    // }));
    app.post('/login', auth.controllers.login.authenticate);
	app.post('/logout', auth.controllers.login.logout, (req, res) => res.status(200).redirect('/login'));

	/** Get current User as JSON */
	app.get(
		'/users/me', 
		auth.middleware.requireAuthentication,
		auth.middleware.requirePermission('read', 'own', 'user'), 
		(req, res) => {
			return res.json({
				user: req.permission.filter(req.user)
			});
		}
	);

	/** Get User */
	app.get(
		'/users/:username',
		auth.middleware.requireAuthentication,
		auth.middleware.requirePermission('read', 'any', 'user'),
		validator.params(Joi.object({
			username: Joi.string().required()
		})),
		async (req, res) => {
			const username = req.params.username;
			const user = await db.api.users.find(username);

			if (!user) {
				throw new UserError(`User ${username} not found`, 404);
			}

			return res.json({
				user: req.permission.filter(user)
			});
		}
	);

	/** Create User */
	app.get(
		'/users',
		auth.middleware.requireAuthentication, 
		auth.middleware.requirePermission('read', 'any', 'user'),
		async (req, res) => {
			const usersMap = await db.api.users.all() || {};
			const users = Object.values(usersMap)
				.map(user => req.permission.filter(user));

			res.json(users);
		}
	);

	/** Create User */
	app.post(
		'/users',
		auth.middleware.requireAuthentication, 
		auth.middleware.requirePermission('create', 'any', 'user'),
		validator.body(Joi.object({
			user: User.schema
		})),
		async (req, res) => {
			const user = req.permission.filter(req.body.user);
			const username = user.username;

			await db.api.users.create(username, user);


			res.json({ user: await db.api.users.find(username) });
		}
	);

	/** Update current User */
	app.patch(
		'/users/me',
		auth.middleware.requireAuthentication,
		auth.middleware.requirePermission('update', 'own', 'user'),
		validator.body(Joi.object({
			user: User.schema
		})),
		async (req, res) => {
			const username = req.user.username;
			const user = req.permission.filter(req.body.user);
			
			await db.api.users.update(username, user);

			res.json({ user: await db.api.users.find(username) });
		}
	);

	/** Update User */
	app.patch(
		'/users/:username',
		auth.middleware.requireAuthentication, 
		auth.middleware.requirePermission('update', 'any', 'user'),
		validator.params(Joi.object({
			username: Joi.string().required()
		})),
		validator.body(Joi.object({
			user: User.schema
		})),
		async (req, res) => {
			const username = req.params.username;
			const user = req.permission.filter(req.body.user);

			await db.api.users.update(username, user);

			res.json({ user: await db.api.users.find(username) });
		}
	);

	/** Update User */
	app.delete(
		'/users/:username',
		auth.middleware.requireAuthentication, 
		auth.middleware.requirePermission('delete', 'any', 'user'),
		validator.params(Joi.object({
			username: Joi.string().required()
		})),
		async (req, res) => {
			await db.api.users.delete(req.params.username);

			res.status(200).json({ success: true });
		}
	);

	/** Update current password */
	app.post(
		'/users/me/change-password',
		auth.middleware.requireAuthentication,
		auth.middleware.requirePermission('update', 'own', 'user:password'),
		validator.body(Joi.object({
			password: Joi.string().required()
		})),
		async (req, res) => {
			const username = req.user.username;
			const newPassword = req.body.password;

			await db.api.users.updatePassword(username, newPassword);

			res.status(200).json({ success: true });
		}
	);

	/** Update User Password */
	app.post(
		'/users/:username/change-password',
		auth.middleware.requireAuthentication, 
		auth.middleware.requirePermission('update', 'any', 'user:password'),
		validator.body(Joi.object({
			password: Joi.string().required()
		})),
		async (req, res) => {
			const username = req.params.username;
			const newPassword = req.body.password;

			try {
				await db.api.users.updatePassword(username, newPassword);
			} catch (e) {
				console.log(e)
			}

			res.status(200).json({ success: true });
		}
	);

	return app;
};
