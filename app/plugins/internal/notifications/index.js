const { newestCovidCSV, parseCityData, filterHistoricalData } = require('./api');

const cities = {
	'de.ni.03355': 'Lüneburg',
	'de.sh.01003': 'Lübeck'
};


module.exports = function bahnInit(APP) {
	const { state, logger, http, database } = APP;

	/**
	 * @ACTION
	 * Update COVID data
	 *
	 * @constant COVID:UPDATE
	 * @property {object} changes The data to be set
	 * @example
	 * state.invoke('COVID:UPDATE', { cities: { 'city-id': { } } })
	 */
	state.addAction(
		'NOTIFICATIONS:CREATE', 
		(state, data) => ({
			...state,
			covid: data
		}),
		(data) => (typeof data === 'object') ? data : false
	);

	http.addComponentFile('covid', __dirname + '/component.html');

	return {
		version: '0.0.1',
		description: 'A widget to display COVID data'
	};
};