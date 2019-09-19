const proxy = require('http-proxy-middleware');

module.exports = function dashboardRoutes(app, requireAuth) {
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
			// logLevel: 'debug',
			pathRewrite: {
				'^/files': '/',
				'^/files/': '/'
			},
			onProxyReq(proxyReq, req, res) {
				proxyReq.setHeader('X-Files-Auth', req.user.id);
			}
		})
	);
};