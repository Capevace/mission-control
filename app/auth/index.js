const path = require('path');
const fs = require('fs/promises');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');

const logger = require('@helpers/logger').createLogger('Auth');
const crypto = require('@helpers/crypto');

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
function authenticateRequest(req, res, next) {
	if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
};



function initDB(db) {
    return {
        /**
         * @param {User} username
         */
        async findUser(username) {
            const defaultUser = { username: 'mat', password: 'mat', avatarUrl: 'https://media1.tenor.com/images/485b6e253f0074fd62aea7eff6a6427d/tenor.gif', displayName: 'Lukas' };

            const users = db.get('users', { [defaultUser.username]: defaultUser });

            return users[username];
        }
    }
}

module.exports = function initAuth(config, db, sessionSecret) {
    const { findUser } = initDB(db);

    passport.use(
        'local',
        new LocalStrategy(
                {
                usernameField: 'username',
                passwordField: 'password'
            },
            async (username, password, done) => {
                const user = await findUser(username);

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
        const user = await findUser(username);

        if (!user) return cb(null, false);

        return cb(null, user);
    });

    return {
        passport,
        authenticateRequest,
        authenticate: passport.authenticate('local', {
            failureRedirect: '/login',
            successRedirect: '/',
            failureFlash: 'Incorrect username or password.'
        }),
        async getLoginPage(req, res) {
            const error = req.flash('error');

            let content = await fs.readFile(path.resolve(__dirname,'../views/login.html'));

            content = content.toString()
                .replace(
                    '{{ERROR_MSG}}',
                    error.length > 0
                        ? `<p class="error-msg">${error[0]}</p>`
                        : ''
                )
                .replace(/\{\{URL\}\}/g, config.http.url);

            return res.send(content);
        },
        logout() {},
        generateAPIToken(user) {
            return jwt.sign({ user: { username: user.username } }, sessionSecret, {
                expiresIn: 86400,
				issuer: 'mission-control',
				audience: 'mission-control:api'
			});
        },
        verifyAPIToken(token) {
            try {
                return jwt.verify(token, sessionSecret, {
                    issuer: 'mission-control',
                    audience: 'mission-control:api'
                });
            } catch (e) {
                logger.debug('Error verifying JWT', e);
                return false;
            }
        }
    };
};