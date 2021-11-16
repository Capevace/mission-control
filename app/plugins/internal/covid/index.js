const { fetchNewestCOVIDData, parseCityData, fetchHistoricalData, findCityInHistoricalData } = require('./api');

const cities = {
	'de.ni.03355': 'Lüneburg',
	'de.sh.01003': 'Lübeck'
};




module.exports = function bahnInit(APP) {
	const { sync, permissions, logger, dashboard, database } = APP;

	// permissions
	// 	.allow('admin', 'create', 'covid-data', 'any');

	const service = sync.createService('covid', { cities: {} });

	dashboard.component('covid')
		.custom(__dirname + '/component.html');


	const refreshInfo = async () => {
		try {
			const csvText = await fetchNewestCOVIDData();
			// const historicalDataJSON = await fetchHistoricalData();

			let citiesData = { ...cities };
			let historicalData = { ...cities };

			for (const id in citiesData) {
				citiesData[id] = parseCityData(csvText, id);
				// historicalData[id] = findCityInHistoricalData(historicalDataJSON, id);
			}

			// database.set('covid-data-historical', historicalData);

			service.setState({
				cities: citiesData,
				historical: historicalData
			});
		} catch (e) {
			logger.error('Error occurred during covid API check', e);
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