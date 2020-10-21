const state = require('@state');
const logger = require('@helpers/logger').createLogger('Video Queue', 'greenBright');

module.exports = async function videoQueue() {
	state.subscribe('action:VIDEO-QUEUE:PUSH', data => {
		logger.info('Queueing:', data.actionData.video.url);
	});

	state.subscribe('action:VIDEO-QUEUE:FINISHED', data => {
		logger.info('Finished:', data.actionData.video.url);
	});

	state.subscribe('action:VIDEO-QUEUE:PROGRESS', data => {
		logger.info(
			'Download Progress:',
			data.actionData.videoUrl,
			data.actionData.progress.percentage
		);
	});
};
