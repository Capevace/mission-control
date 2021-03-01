module.exports = function youtubeDownloadInit(APP) {
	APP.http.raw.proxy('/youtube-downloader', 'http://localhost:3003');

	return {
		version: '0.0.1',
		description: 'An iFrame to host youtube-dl-ui'
	};
};