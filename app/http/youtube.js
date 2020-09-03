const config = require('@config');
const proxy = require('http-proxy-middleware');

module.exports = function youtubeRoutes(app, requireAuth) {
	app.use(
		'/youtube-downloader',
		requireAuth(),
		proxy(
			'/', 
			{
				target: 'http://localhost:3003', 
				logLevel: config.debug ? 'debug' : 'warn',
				ws: true,
				pathRewrite: {
					'^/youtube-downloader': '/',
					'^/youtube-downloader/': '/'
				}
			}
		)
	);
};
