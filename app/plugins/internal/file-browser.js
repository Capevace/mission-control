module.exports = function fileBrowserInit(APP) {
	APP.http.raw.proxy(
		'/files', 
		'http://localhost:3002', 
		{
			onProxyReq(proxyReq, req) {
				proxyReq.setHeader('X-Files-Auth', req.user.username);
			}
		}
	);

	return {
		version: '0.0.1',
		description: 'An iFrame to host filebrowser.xyz'
	};
};