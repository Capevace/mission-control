const superagent = require('superagent');

module.exports = {
	fetchNewestCOVIDData,
	parseCityData,
	fetchHistoricalData,
	findCityInHistoricalData
};

/**
 * Fetch historical COVID data
 * @return {Array<HistoricalCityData>}
 */
async function fetchHistoricalData() {
	// https://interaktiv.morgenpost.de/data/corona/rki-incidence.json?t=38yjt
	const { body } = await superagent.get('https://interaktiv.morgenpost.de/data/corona/rki-incidence.json');

	return body;
}

/**
 * Returns an array of incidence objects { date: Date, value: number }
 * @param  {string} cityId ID of city
 * @return {Array<{ date: Date, value: number }>}
 */
function findCityInHistoricalData(historicalData, cityId) {
	let city = null;
	for (const c of body) {
		if (c.id === cityId) {
			city = c;
			break;
		}
	}

	if (!city) {
		throw new Error(`Unable to find city with ID ${cityId}`);
	}

	return city.history;
}

// Return routes to Lübeck (includes buses)
async function fetchNewestCOVIDData() {
	const { text } = await superagent.get('https://interaktiv.morgenpost.de/data/corona/cases.rki.v2.csv');

	return text;
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