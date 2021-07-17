/**
 * Initialize the plugin
 *
 * @param {PluginAPI} APP
 * @returns {Plugin}
 */
module.exports = function fileBrowserInit(APP) {
	APP.http.proxy(
		'/', 
		'http://localhost:3002', 
		{
			onProxyReq(proxyReq, req) {
				if (req.user)
					proxyReq.setHeader('X-Files-Auth', req.user.username);
			}
		}
	);

	return {
		version: '0.0.1',
		description: 'An iFrame to host filebrowser.xyz'
	};
};