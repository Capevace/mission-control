const logger = require('@helpers/logger').createLogger(
	'Spotify',
	'greenBright'
);

const superagent = require('superagent');
const SpotifyWebApi = require('spotify-web-api-node');

const makeAPI = require('./api');
const routes = require('./routes');

module.exports = async function spotifyInit(APP) {
	const { sync, database, logger, config, http } = APP;

	const spotifyData = database.get('spotify', {});

	const spotifyApi = new SpotifyWebApi(spotifyData.accessToken ? spotifyData : {});

	const service = sync.createService('spotify', {
		tokens: null,
		currentTrack: null,
	});

	const API = makeAPI(APP, spotifyApi, service);

	// // Register Page component
	// http.addComponentFile('spotify-page', __dirname + '/spotify-page.html');

	// // Register Page in Vue Router
	// http.addPage('/spotify', 'Spotify', 'spotify-page', {
	// 	icon: 'spotify-icon',
	// 	menu: 200,
	// });

	// Register HTTP routes
	routes(APP, API, service);

	service
		.action('update-tokens')
		.requirePermission('update', 'dashboard:widget', 'any')
		.validate((Joi) =>
			Joi.object({
				accessToken: Joi.string().trim().required(),
				expiresAt: Joi.date().required(),
				refreshToken: Joi.string().required(),
			})
		)
		.handler((tokens, { state, database }) => {
			spotifyApi.setAccessToken(tokens.accessToken);
			state.tokens = tokens;
			
			database.set('spotify', tokens);
		});

	service
		.action('play-kush')
		.requirePermission('update', 'spotify:track', 'any')
		.validate((Joi) =>
			Joi.object({
				position: Joi.number().integer().min(0).default(26)
			})
		)
		.handler(async ({ position }, { state, setState, UserError }) => {
			await spotifyApi.play({
				context_uri: 'spotify:playlist:4Ih76FCCl6uZtN6bJNnXeh',
				offset: {
					position: position
				}
			});
			const trackData = await spotifyApi.getMyCurrentPlayingTrack();
			
			state.currentTrack = { name: trackData.body.item.name };
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

			await API.scheduleTokenRefresh(
				new Date(),
				spotifyData.refreshToken
			);
		} else {
			logger.debug(`Access token is still fresh.`);
			await API.authorizeSpotify({
				accessToken: spotifyData.accessToken,
				expiresAt: new Date(spotifyData.expiresAt),
				refreshToken: spotifyData.refreshToken,
			});
		}
	}

	return {
		version: '0.0.1',
		description: 'A built in Spotify player',
	};
};
