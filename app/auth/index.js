const path = require('path');
const fs = require('fs/promises');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');

const logger = require('@helpers/logger').createLogger('Auth');
const crypto = require('@helpers/crypto');

// const initRoutes = require('./database-api');

/**
 * AUTH MODULE
 * middleware
 *     passport
 *     requireAuthentication
 *     logout
 * controller
 *     composeLoginPage
 *     performAuthentication
 * tokens
 *     generateJWT
 *     verifyJWT
 * api
 * 	   updateUserMeta
 * 	   updateUsername
 * 	   updateUserPassword
 * 	   updateUserRole
 * permissions
 *     canEditUser
 */



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

                if (password === user.password || user && (await crypto.comparePassword(password, user.password))) {
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

    return {
        passport,
        
        middleware: {
        	/** 
        	 * The initialized passport instance
        	 */
        	passport,

            /**
             * Middleware to redirect based on the auth state.
             *
             * If 'next' is passed for any of the arguments,
             * the middleware will call the next function instead
             * of redirecting.
             *
             * @param {string} loggedInUrl URL to redirect to if logged in
             * @param {string} loggedOutUrl URL to redirect to if logged out
             */
            requireAuthentication(req, res, next) {
                if (req.isAuthenticated()) {
                    next();
                } else {
                    res.redirect('/login');
                }
            },

            /**
             * Logout user
             * @param  {Request} req
             * @param  {Response} res
             */
            logout(req, res) {
            	req.logout();

            	res.redirect('/login');
            }
        },
        controller: {
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

	        updateUser(user, newUsername) {

	        }
        },

        tokens: {
            generate(user) {
                return jwt.sign({ user: { username: user.username } }, sessionSecret, {
                    expiresIn: 86400,
                    issuer: 'mission-control',
                    audience: 'mission-control:api'
                });
            },
            verify(token) {
                try {
                    return jwt.verify(token, sessionSecret, {
                    	expiresIn: 86400,
                        issuer: 'mission-control',
                        audience: 'mission-control:api'
                    });
                } catch (e) {
                    logger.debug('Error verifying JWT', e);
                    return false;
                }
            },
        },

        permissions: {
            /**
             * Can the user edit user data.
             * 
             * @param  {User} user The user that's making the edit.
             * @param  {string} usernameToEdit The username of the user that's being edited.
             * @return {boolean}
             */
            canEditUser(currentUser, usernameToEdit) {
                // Guests are not allowed to change usernames
                if (currentUser.role === 'guest')
                    return false;

                // Only allowed if username is the same, or the editing user is an admin
                if (currentUser.username !== usernameToEdit && currentUser.role !== 'admin')
                    return false;

                return true;
            }
        }
    };
};