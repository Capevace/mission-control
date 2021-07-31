const proxy = require('http-proxy-middleware');

module.exports = function youtubeDownloadInit(APP) {
	APP.http.root.use(
		'/ssh',
		APP.auth.middleware.requirePermission('update', 'any', 'shell'),
		proxy('/ssh', {
			target: 'http://datenregal.local:3003/ssh',
			logLevel: this.proxyLogLevel,
			ws: true,
			changeOrigin: false,
			pathRewrite: {
				'^/ssh/': '/'
			}
		})
	);

	return {
		version: '0.0.1',
		description: 'An iFrame to host youtube-dl-ui'
	};
};