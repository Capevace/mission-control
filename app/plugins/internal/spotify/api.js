const superagent = require('superagent');

module.exports = function api(APP, spotifyApi, service) {
	const { state, database, logger, config } = APP;

	let tokenData = database.get('spotify', {});
	
	// Request an access token from the Spotify API using an auth code.
	async function requestAccessToken(code) {
		try {
			const result = await superagent
				.post('https://accounts.spotify.com/api/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.set(
					'Authorization',
					`Basic ${Buffer.from(
						config.spotify.clientId + ':' + config.spotify.secret
					).toString('base64')}`
				)
				.send({
					code: code,
					redirect_uri: `${config.http.url}/plugins/spotify/auth/callback`,
					grant_type: 'authorization_code'
				});

			const { access_token, refresh_token, expires_in } = result.body;

			// expires_in is in seconds. So we add it to the time as milliseconds by
			// multiplying by 1000.
			let expiresAt = new Date();
			expiresAt.setTime(expiresAt.getTime() + expires_in * 1000);

			await authorizeSpotify({ accessToken: access_token, expiresAt, refreshToken: refresh_token });
		} catch (e) {
			throw e.body || e;
		}
	}

	// Get new access tokens from the Spotify API using a refresh token
	async function refreshAccessToken(refreshToken) {
		try {
			const response = await superagent
				.post('https://accounts.spotify.com/api/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.set(
					'Authorization',
					`Basic ${Buffer.from(
						`${config.spotify.clientId}:${config.spotify.secret}`
					).toString('base64')}`
				)
				.send({
					refresh_token: refreshToken,
					grant_type: 'refresh_token'
				});

			const { access_token, expires_in } = response.body;

			// expires_in is in seconds. So we add it to the time as milliseconds by
			// multiplying by 1000.
			let expiresAt = new Date();
			expiresAt.setTime(expiresAt.getTime() + expires_in * 1000);

			return { accessToken: access_token, expiresAt, refreshToken };
		} catch (e) {
			throw e.body || e;
		}
	}

	// Update the tokens in the database and state
	async function authorizeSpotify(tokens) {
		const { accessToken, expiresAt, refreshToken } = tokens;

		// Schedule a token refresh at a given time
		scheduleTokenRefresh(expiresAt, refreshToken);

		logger.info('Successfully authorized Spotify');

		// Save to database so its persistent and then update state so clients are notified.
		await service.invokeAction('update-tokens', tokens);
	}

	function scheduleTokenRefresh(expiresAt, refreshToken) {
		const dateDifference = Math.max(0, expiresAt.getTime() - Date.now());
		logger.debug(`Scheduled token refresh in ${dateDifference / 1000}s.`);

		setTimeout(async () => {
			try {
				const tokens = await refreshAccessToken(refreshToken);
				await authorizeSpotify(tokens);
			} catch (e) {
				logger.error('Couldn\'t refresh access token', e);
			}
		}, dateDifference);
	}

	function validateTokenUpdate(data) {
		return ('accessToken' in data && 'expiresAt' in data && 'refreshToken' in data) 
			? data
			: false;
	}

	return { 
		requestAccessToken, 
		refreshAccessToken, 
		authorizeSpotify, 
		scheduleTokenRefresh, 
		validateTokenUpdate 
	};
};