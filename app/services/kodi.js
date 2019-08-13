const state = require('@state');
const log = require('@helpers/log').logger('Kodi Service');
const kodi = require('kodi-ws');

let connections = {

};

kodi('filmregal.local', 9090).then(conn => {
	connections['filmregal'] = conn;
	log('Established connection to Kodi.');
});

module.exports = async function kodi() {
	state.subscribe('action:KODI:RUN', async (data) => {
		const actionData = {
			args: [],
			...data.actionData
		};

		log('Running Kodi action:', actionData);
		console.log((await connections[actionData.kodiId].run(actionData.command, ...actionData.args)));
	});

	state.subscribe('action:VIDEO-QUEUE:FINISHED', data => {
		log('Finished:', data.actionData.video.url);
	});

	state.subscribe('action:VIDEO-QUEUE:PROGRESS', data => {
		log(
			'Download Progress:',
			data.actionData.videoUrl,
			data.actionData.progress.percentage
		);
	});
};
