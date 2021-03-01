# Mission Control Ultimate Goals

- Single-binary
- Cross-platform
- Plugin Support
	- Register Pages
		- iFrame
		- HTML/Vue
	- Register Dashboard Components
- Theme ability
	- Move Tailwind stuff to local classes
- Config Screen


```js

module.exports = {
	init(APP) {
		const options = {
			keys: [],
			...APP.config.spotify
		};


	}
};

module.exports = function (APP) {
	const { http, config, actions } = APP.createPlugin('spotify', 'Does this');

	plugin.config

	plugin.actions.register('UPDATE-TOKEN', reducer, validate);
	plugins.actions.call('ACTION', data)

	plugin.http.get('/spotify/auth', requireAuth(), (req, res) => {
		res.redirect(
			`https://accounts.spotify.com/authorize?${queryString.stringify({
				response_type: 'code',
				client_id: config.spotify.clientId,
				scope: 'user-read-private user-read-email user-read-birthdate user-read-playback-state user-modify-playback-state user-library-read playlist-read-private streaming playlist-modify-public playlist-modify-private user-library-modify ugc-image-upload user-follow-modify user-follow-read',
				redirect_uri: `${req.hostUrl}/spotify/auth/callback`,
				state: 'whatthefuckisthis'
			})}`
		);
	});
	plugin.http.get('/');

	return plugin;
}

```