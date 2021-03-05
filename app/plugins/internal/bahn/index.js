const { routesToHL } = require('./api');

module.exports = function bahnInit(APP) {
	const { state, logger, http } = APP;

	/**
	 * @ACTION
	 * Update Deutsche Bahn route data
	 *
	 * @constant BAHN:UPDATE
	 * @property {object} changes The data to be set
	 * @example
	 * state.invoke('BAHN:UPDATE', { })
	 */
	state.addAction(
		'BAHN:UPDATE', 
		(state, data) => ({
			...state,
			bahn: data
		}),
		(data) => (typeof data === 'object') ? data : false
	);

	http.addComponentFile('bahn', __dirname + '/component.html');

	const refreshInfo = async () => {
		try {
			const hlRoutes = await routesToHL();
			
			state.invoke('BAHN:UPDATE', {
				routes: hlRoutes
			});
		} catch (e) {
			logger.error('Error occurred during route check', e);

			state.invoke('BAHN:UPDATE', {
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