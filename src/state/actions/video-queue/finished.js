module.exports.call = function(state, { videoUrl }) {
	let videoQueue = state.videoQueue;

	if (videoQueue[videoUrl]) delete videoQueue[videoUrl];

	return {
		...state,
		videoQueue
	};
};

module.exports.validate = function(data) {
	if (typeof data.videoUrl === 'string') return data;

	return false;
};
