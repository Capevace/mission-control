const config = require('@config');

module.exports = {
	notifications: [],
	spotify: {
		accessToken: null,
		expiresAt: null
	},
	scenes: {
		movie: { name: 'Movie Night', active: false },
		chill: { name: 'Chill', active: false }
	}
};
