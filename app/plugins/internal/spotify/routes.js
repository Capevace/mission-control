const fs = require('fs/promises');
const express = require('express');
const queryString = require('querystring');

module.exports = function routes(APP) {
	const { http, state, logger, config } = APP;

	http.get('/auth', (req, res) => {
		res.redirect(
			`https://accounts.spotify.com/authorize?${queryString.stringify({
				response_type: 'code',
				client_id: config.spotify.clientId,
				scope: 'user-read-private user-read-email user-read-birthdate user-read-playback-state user-modify-playback-state user-library-read playlist-read-private streaming playlist-modify-public playlist-modify-private user-library-modify ugc-image-upload user-follow-modify user-follow-read',
				redirect_uri: `${req.hostUrl}/auth/callback`,
				state: 'whatthefuckisthis'
			})}`
		);
	});

	// Create the callback route for spotify to call.
	// This is called in response to an auth request.
	// The response will contain the auth code used to request access tokens.
	http.get('/auth/callback', async (req, res) => {
		const code = req.query.code || null;
		const stateId = req.query.state || null;

		if (stateId === null) {
			logger.error('Authentication failed. State mismatch:', stateId);
			res.status(500).json({
				message: 'State mismatch.'
			});
		} else {
			// Emit event containing auth code so the Spotify service can request access tokens.
			state.emitEvent('spotify:callback', {
				code
			});

			res.redirect(http.baseUrl);
		}
	});

	// // Create the callback route for spotify to call.
	// // This is called in response to an auth request.
	// // The response will contain the auth code used to request access tokens.
	// http.get('/auth/access_token', async (req, res) => {
	// 	const code = req.query.code || null;
	// 	const stateId = req.query.state || null;

	// 	if (stateId === null) {
	// 		log('Authentication failed. State mismatch:', stateId);
	// 		res.status(500).json({
	// 			message: 'State mismatch.'
	// 		});
	// 	} else {
	// 		// Emit event containing auth code so the Spotify service can request access tokens.
	// 		state.emitEvent('spotify:callback', {
	// 			code
	// 		});

	// 		res.json('Logging in');
	// 	}
	// });

	const renderSpotify = async (req, res) => {
		const spotifyData = state.get().spotify;
		
		if (!spotifyData || !spotifyData.accessToken) {
			res.redirect(http.baseUrl + '/auth');
		} else {
			const indexFile = await fs.readFile(config.spotify.path + '/index.html')
				.toString()
				.replace(/<MISSION_CONTROL_URL>/g, config.http.url)
				.replace(/<MISSION_CONTROL_TOKEN>/g, req.session.jwt)
				.replace(/<MISSION_CONTROL_SPOTIFY_TOKEN>/g, state.get().spotify.accessToken)
				.replace(/<MISSION_CONTROL_SPOTIFY_EXPIRY>/g, state.get().spotify.expiresAt);

			res.type('text/html').send(indexFile);
		}
	};

	http.get('/', renderSpotify);
	http.raw.get('/spotify', renderSpotify);

	http.use(
		'/',
		express.static(config.spotify.path)
	);
}