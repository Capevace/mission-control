/*global Buffer */
const config = require('@config');
const database = require('@database');
const state = require('@state');
const logger = require('@helpers/logger').createLogger('Spotify', 'greenBright');

const superagent = require('superagent');

const makeAPI = require('./api');
const routes = require('./routes');

module.exports = function spotifyInit(APP) {
	const { state, database, logger, config } = APP;
	const API = makeAPI(APP);

	const spotifyData = database.get('spotify', {});
	

	/**
	 * @ACTION
	 * Update the Spotify access token thats saved in the database and state.
	 *
	 * @constant SPOTIFY:UPDATE-TOKEN
	 * @property {string} accessToken The access token to update.
	 * @property {Date} expiresAt The date the access token expires at.
	 * @property {string} refreshToken The token to request a new access token with.
	 * @example demo-action-call
	 */
	state.addAction(
		'SPOTIFY:UPDATE-TOKEN', 
		API.updateTokenState, 
		API.validateTokenUpdate
	);

	state.subscribe('spotify:callback', async ({ code }) => {
		logger.debug('Requesting access token from Spotify.');

		try {
			const data = await API.requestAccessToken(code);
			API.authorizeSpotify(
				data.accessToken,
				data.expiresAt,
				data.refreshToken
			);
		} catch (e) {
			logger.error('Couldnt request access token.', e);
		}
	});

	// If Spotify isnt authorized, we cant use it.
	if (!spotifyData.accessToken) {
		logger.warn(
			`Spotify isnt authorized. Visit ${require('chalk').cyan(
				`${config.http.url}/spotify/auth`
			)} and log in.`
		);
	} else {
		const expiresAt = new Date(spotifyData.expiresAt);
		const now = new Date();

		// Get a new token, if the old one has expired.
		// If not, set a timeout to get a new token ahead of time.
		if (expiresAt <= now) {
			logger.debug('Access token has expired. Requesting new token.');

			API.scheduleTokenRefresh(new Date(), spotifyData.refreshToken);
		} else {
			logger.debug(`Access token is still fresh.`);
			API.authorizeSpotify(
				spotifyData.accessToken,
				new Date(spotifyData.expiresAt),
				spotifyData.refreshToken
			);
		}
	}

	// Register HTTP routes
	routes(APP);

	return {
		version: '0.0.1',
		description: 'A built in Spotify player'
	};
};
