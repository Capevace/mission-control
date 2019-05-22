module.exports.call = function(state, { videoUrl, progress }) {
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
};

module.exports.validate = function(data) {
	if (typeof data.videoUrl === 'string' && typeof data.progress === 'object')
		return data;

	return false;
};
