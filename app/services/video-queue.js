const state = require('@state');
const log = require('@helpers/log').logger('Video Queue', 'greenBright');

module.exports = async function videoQueue() {
	state.subscribe('action:VIDEO-QUEUE:PUSH', data => {
		log('Queueing:', data.actionData.video.url);
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
