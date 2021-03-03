const { newestCovidCSV, parseCityData } = require('./api');

const cities = {
	'de.ni.03355': 'Lüneburg',
	'de.sh.01003': 'Lübeck'
};


module.exports = function bahnInit(APP) {
	const { state, logger, http } = APP;

	/**
	 * @ACTION
	 * Update COVID data
	 *
	 * @constant COVID:UPDATE
	 * @property {object} changes The data to be set
	 * @example
	 * state.run('COVID:UPDATE', { cities: { 'city-id': { } } })
	 */
	state.registerAction(
		'COVID:UPDATE', 
		(state, data) => ({
			...state,
			covid: data
		}),
		(data) => (typeof data === 'object') ? data : false
	);

	http.registerComponentFile('covid', __dirname + '/component.html');


	const refreshInfo = async () => {
		try {
			const csvText = await newestCovidCSV();
			let citiesData = { ...cities };

			for (const id in citiesData) {
				citiesData[id] = parseCityData(csvText, id);
			}

			state.run('COVID:UPDATE', {
				cities: citiesData
			});
		} catch (e) {
			logger.error('Error occurred during covid API check', e);

			state.run('COVID:UPDATE', {
				cities: {}
			});
		}
	};

	const every6Hours = 1000 * 60 * 60 * 6;
	refreshInfo();
	setInterval(refreshInfo, every6Hours);

	return {
		version: '0.0.1',
		description: 'A widget to display COVID data'
	};
};