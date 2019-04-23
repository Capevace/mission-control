const fs = require('fs');
const path = require('path');

const actionIdToPath = actionId =>
	actionId
		.replace(/:/g, '/')
		.replace(/_/g, '-')
		.toLowerCase();

// Take the actions and require their respective js files.
const actions = [
	// Notificatons Actions
	'NOTIFICATIONS:CREATE',
	'NOTIFICATIONS:DELETE',
	'NOTIFICATIONS:MARK-AS-READ',
	'NOTIFICATIONS:SET',

	// Spotify
	'SPOTIFY:UPDATE-TOKEN',
	'SYSTEM-INFO:UPDATE',

	// Scene
	'SCENE:TOGGLE'
].reduce(
	(allActions, action) => ({
		...allActions,
		[action]: require(`./${actionIdToPath(action)}`)
	}),
	{}
);

module.exports = actions;
