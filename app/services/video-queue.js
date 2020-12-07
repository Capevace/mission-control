const state = require('@state');
const logger = require('@helpers/logger').createLogger('Video Queue', 'greenBright');

async function videoQueueInit() {
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

module.exports = {
	actions: {
		/**
		 * Push a video onto the video queue.
		 *
		 * @constant VIDEO-QUEUE:PUSH
		 * @property {Object} video The video object to push onto the queue.
		 * @property {string} video.url The url to download the file from.
		 * @property {string} video.format The format to download the file as.
		 * @example
		 * state.callAction('VIDEO-QUEUE:PUSH', { video: { url: 'https://...', format: 'mp4' || 'mp3' || 'm4a' } })
		 */
		'VIDEO-QUEUE:PUSH': {
			update(state, { video: { url, format } }) {
				return {
					...state,
					videoQueue: {
						...state.videoQueue,
						[url]: {
							url: url,
							format: format,
							progress: null,
							title: url
						}
					}
				};
			},
			validate(data) {
				if (
					typeof data.video === 'object' &&
					typeof data.video.url === 'string' &&
					(data.video.format === 'mp4' ||
						data.video.format === 'mp3' ||
						data.video.format === 'm4a')
				)
					return data;

				return false;
			}
		},

		/**
		 * Update the progress for a video on the queue.
		 *
		 * @constant VIDEO-QUEUE:PROGRESS
		 * @property {string} videoUrl The video url to update the progress on.
		 * @property {Object} progress The progress object.
		 * @property {number} progress.downloaded The downloaded number of bytes.
		 * @property {number} progress.totalBytes The total number of bytes.
		 * @property {number} progress.state A status message.
		 * @example
		 * state.callAction('VIDEO-QUEUE:PROGRESS', {
		 *     videoUrl: 'https://..',
		 *     progress: {
		 *         downloaded: 30,
		 *         totalBytes: 100, // 30%,
		 *         state: 'downloading'
		 *     }
		 * }})
		 */
		'VIDEO-QUEUE:PROGRESS': {
			update(state, { videoUrl, progress }) {
				return {
					...state,
					videoQueue: {
						...state.videoQueue,
						[videoUrl]: {
							...state.videoQueue[videoUrl],
							progress: progress
						}
					}
				};
			},
			validate(data) {
				if (typeof data.videoUrl === 'string' && typeof data.progress === 'object')
					return data;

				return false;
			}
		},

		/**
		 * Remove a video from the queue because it is finished or errored out.
		 *
		 * @constant VIDEO-QUEUE:FINISHED
		 * @property {string} videoUrl The video url to remove from the queue.
		 * @example demo-action-call
		 */
		'VIDEO-QUEUE:FINISHED': {
			update(state, { videoUrl }) {
				let videoQueue = state.videoQueue;

				if (videoQueue[videoUrl]) delete videoQueue[videoUrl];

				return {
					...state,
					videoQueue
				};
			},
			validate(data) {
				if (typeof data.videoUrl === 'string') return data;

				return false;
			}
		}
	},
	init: videoQueueInit
};