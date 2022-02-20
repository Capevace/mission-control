module.exports = function dashboardExample(APP) {
	const { dashboard } = APP;

	dashboard
		.component('generic-info-block')
		.custom(__dirname + '/info-block.html');

	dashboard
		.component('generic-label')
		.custom(__dirname + '/label.html');

	return {
		version: '0.0.1',
		description: 'Dashboard Components',
	};
};
