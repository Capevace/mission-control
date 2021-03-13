module.exports = function dashboardExample(APP) {
	const { http } = APP;

	http.addComponentFile('links', __dirname + '/links.html');

	return {
		version: '0.0.1',
		description: 'Dashboard Components'
	};
};