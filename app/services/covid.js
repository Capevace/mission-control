const state = require('@state');
const logger = require('@helpers/logger').createLogger('COVID');
const superagent = require('superagent');

const cities = {
	'de.ni.03355': 'Lüneburg',
	'de.sh.01003': 'Lübeck'
};

module.exports = async function covid() {
	const refreshInfo = async () => {
		try {
			const csvText = await newestCovidCSV();
			let citiesData = { ...cities };

			for (const id in citiesData) {
				citiesData[id] = parseCityData(csvText, id);
			}

			state.callAction('COVID:UPDATE', {
				cities: citiesData
			});
		} catch (e) {
			logger.error('Error occurred during covid API check', e);
		}
	};

	const every6Hours = 1000 * 60 * 60 * 6;
	refreshInfo();
	setInterval(refreshInfo, every6Hours);
};

// Return routes to Lübeck (includes buses)
async function newestCovidCSV() {
	try {
		const { text } = await superagent.get('https://interaktiv.morgenpost.de/data/corona/cases.rki.v2.csv');

		return text;
	} catch (e) {
		logger.error('Could not fetch COVID data', e);
		return [];
	}
}

function parseCityData(csv, cityId) {
	// Add a slash in front of dots in the id for the regex to
	// take them literally.
	const sanitizedId = cityId.replace(/\./g, '\\.');

	const regex = new RegExp(`^(${sanitizedId}.*)`, 'gm');

	const regexResult = regex.exec(csv);

	if (!regexResult) {
		return null;
	}

	const line = regexResult[1];
	const parts = line.split(',');

	return {
		id: cityId,
		casesTotal: parseInt(parts[5]),
		casesPrevious: parseInt(parts[6]),
		casesLast7Days: parseInt(parts[5]) - parseInt(parts[6]),
		casesPerPopulation: parseFloat(parts[8]),
		population: parseInt(parts[7]),
		date: parseDate(parts[9]),
		label: parts[3]
	};
}

function parseDate(str) {
	var y = str.substr(0, 4),
		m = str.substr(4, 2) - 1,
		d = str.substr(6, 2);
	var D = new Date(y, m, d);
	return (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d) ? D : null;
}