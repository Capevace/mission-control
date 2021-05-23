const { newestCovidCSV, parseCityData, filterHistoricalData } = require('./api');

const cities = {
	'de.ni.03355': 'Lüneburg',
	'de.sh.01003': 'Lübeck'
};


module.exports = function bahnInit(APP) {
	const { sync, permissions, logger, http, database } = APP;

	// permissions
	// 	.allow('admin', 'create', 'covid-data', 'any');

	const service = sync.createService('covid', { cities: {} });

	http.addComponentFile('covid', __dirname + '/component.html');


	const refreshInfo = async () => {
		try {
			const csvText = await newestCovidCSV();
			let citiesData = { ...cities };

			let historicalData = database.get('covid-data-historical', {});

			for (const id in citiesData) {
				let historicalCityData = historicalData[id] || [];
				const lastHistoricalDataRow = historicalCityData[historicalCityData.length - 1];

				const newCityData = parseCityData(csvText, id);

				if (!lastHistoricalDataRow || lastHistoricalDataRow.date < newCityData.date) {
					// historicalCityData.push(newCityData);
				}

				historicalData[id] = historicalCityData;
				citiesData[id] = newCityData;
			}

			// database.set('covid-data-historical', historicalData);

			service.setState({
				cities: citiesData,
				// historical: filterHistoricalData(historicalData)
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