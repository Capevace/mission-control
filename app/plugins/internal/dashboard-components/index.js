module.exports = function dashboardExample(APP) {
	const { http } = APP;

	http.registerComponentFile('basic-header', __dirname + '/header.html');

	http.registerComponentFile('links', __dirname + '/links.html');

	return {
		version: '0.0.1',
		description: 'Dashboard Components'
	};
};