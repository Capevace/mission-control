const path = require('path');

module.exports = {
	spotify: {
		publicUiPath: path.resolve(__dirname, '../../../spotify-player/dist'),
		apiUrl: 'https://api.spotify.com/v1',
		authUrl: 'https://accounts.spotify.com',
		clientId: 'f1421bd3dada404da546902b6849f2d7',
		clientSecret: '2192e52bff6740cb8dbce0011305bb20',
		scope:
			'user-read-private user-read-email user-read-birthdate user-read-playback-state user-modify-playback-state user-library-read playlist-read-private streaming playlist-modify-public playlist-modify-private user-library-modify ugc-image-upload user-follow-modify user-follow-read'
	},
	ifttt: {
		webhookKey: 'dq0U6fRhl-t35dc_HnDem5'
	},
	http: {
		baseUrl: 'http://localhost:3000',
		port: 3000
	},
	storage: {
		path: path.resolve(__dirname, '../../storage'),
		databasePath: path.resolve(__dirname, '../../storage/database.json')
	},
	devices: {
		outlets: {
			'tv-leds': { name: 'TV LEDs' },
			'bed-leds': { name: 'Bed LEDs' }
		}
	}
};
