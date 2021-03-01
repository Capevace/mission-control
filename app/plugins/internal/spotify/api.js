module.exports = function api(APP) {
	const { state, database, logger, config } = APP;
	
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
					redirect_uri: `${config.http.url}/spotify/auth/callback`,
					grant_type: 'authorization_code'
				});

			const { access_token, refresh_token, expires_in } = result.body;

			// expires_in is in seconds. So we add it to the time as milliseconds by
			// multiplying by 1000.
			let expiresAt = new Date();
			expiresAt.setTime(expiresAt.getTime() + expires_in * 1000);

			return {
				accessToken: access_token,
				expiresAt,
				refreshToken: refresh_token
			};
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
	function authorizeSpotify(accessToken, expiresAt, refreshToken) {
		const data = { accessToken, expiresAt, refreshToken };

		// Schedule a token refresh at a given time
		scheduleTokenRefresh(expiresAt, refreshToken);

		logger.info('Successfully authorized Spotify');

		// Save to database so its persistent and then update state so clients are notified.
		database.set('spotify', data);
		state.run('SPOTIFY:UPDATE-TOKEN', data);
	}

	function scheduleTokenRefresh(expiresAt, refreshToken) {
		const dateDifference = Math.max(0, expiresAt.getTime() - Date.now());
		logger.debug(`Scheduled token refresh in ${dateDifference / 1000}s.`);

		setTimeout(async () => {
			try {
				const data = await refreshAccessToken(refreshToken);
				authorizeSpotify(
					data.accessToken,
					data.expiresAt,
					data.refreshToken
				);
			} catch (e) {
				logger.error('Couldn\'t refresh access token', e);
				state.run('NOTIFICATIONS:CREATE', {
					title: `Spotify couldn't be authorized.`,
					message: e.message
				});
			}
		}, dateDifference);
	}

	function updateTokenState(state, { accessToken, expiresAt, refreshToken }) {
		return {
			...state,
			spotify: {
				...state.spotify,
				accessToken,
				expiresAt,
				refreshToken
			}
		};
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
		updateTokenState, 
		validateTokenUpdate 
	};
};