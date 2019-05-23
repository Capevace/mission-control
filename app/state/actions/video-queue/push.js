module.exports.call = function(state, { video: { url, format } }) {
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
};

module.exports.validate = function(data) {
	if (
		typeof data.video === 'object' &&
		typeof data.video.url === 'string' &&
		(data.video.format === 'mp4' ||
			data.video.format === 'mp3' ||
			data.video.format === 'm4a')
	)
		return data;

	return false;
};
