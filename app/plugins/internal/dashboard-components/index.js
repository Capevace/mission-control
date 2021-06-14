module.exports = function dashboardExample(APP) {
	const { dashboard } = APP;

	dashboard.component('links')
		.custom(__dirname + '/links.html');

	return {
		version: '0.0.1',
		description: 'Dashboard Components'
	};
};