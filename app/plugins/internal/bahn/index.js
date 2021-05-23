const { routesToHL } = require('./api');

module.exports = function bahnInit(APP) {
	const { state, logger, http } = APP;

	const service = sync.createService('trains', { lines: [] });

	http.addComponentFile('bahn', __dirname + '/component.html');

	const refreshInfo = async () => {
		try {
			const hlRoutes = await routesToHL();
			
			service.setState({
				routes: hlRoutes
			});
		} catch (e) {
			logger.error('Error occurred during route check', e);

			service.setState({
				routes: []
			});
		}
	};
	refreshInfo();
	setInterval(refreshInfo, 1000 * 60 * 3); // refresh every 3 minutes

	return {
		version: '0.0.1',
		description: 'A widget to display train timetables'
	};
};