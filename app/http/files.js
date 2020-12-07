const config = require('@config');
const proxy = require('http-proxy-middleware');

module.exports = function filesRoutes(app, requireAuth) {
	app.use(
		'/files',
		requireAuth(),
		// proxy('http://localhost:3002', {
		// 	proxyReqOptDecorator(proxyReqOpts, req) {
		// 		proxyReqOpts.headers['X-Files-Auth'] = req.user.id;
		// 		return proxyReqOpts;
		// 	},
		// 	limit: '50mb'
		// })
		proxy('/', {
			target: 'http://localhost:3002',
			logLevel: config.debug ? 'debug' : 'warn',
			pathRewrite: {
				'^/files': '/',
				'^/files/': '/'
			},
			onProxyReq(proxyReq, req) {
				proxyReq.setHeader('X-Files-Auth', req.user.username);
			}
		})
	);
};