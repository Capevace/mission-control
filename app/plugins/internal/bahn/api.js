const createHafas = require('db-hafas');
const hafas = createHafas('mission-control');

const stations = {
	'Lüneburg': '626772',
	'Lübeck': '8000237',
	'Munstermannskamp': '599913',
	'Universitätsallee': '597762'
};

module.exports = {
	routesToHL
};

// Return routes to Lübeck (includes buses)
async function routesToHL() {
	const { journeys } = await hafas.journeys(stations['Lüneburg'], stations['Lübeck'], { results: 20 });
	const routes = [];
	for (const journey of journeys) {
		const skipJourney = journey.legs
			.reduce((skip, leg) =>
				skip || leg.line.product !== 'regional',
				false
			);

		if (skipJourney)
			continue;

		const route = await parseJourney(journey);
		const buses = await busForJourney(journey);

		routes.push({
			...route,
			buses
		});
	}

	return routes;
}

// Return routes to Lüneburg (no buses needed)
async function routesToLG() {
	const { journeys } = await hafas.journeys(stations['Lübeck'], stations['Lüneburg'], { results: 20 });

	const routes = [];
	for (const journey of journeys) {
		if (journey.legs.length > 1)
			continue;

		const route = await parseJourney(journey);

		routes.push(route);
	}

	return routes;
}

function routesToText(routes) {
	if (routes.length === 0) {
		return 'No routes found.';
	}

	let text = '';

	for (const route of routes) {
		const depDelay = route.departureDelay
			? ` (+${route.departureDelay})`
			: '';

		const arrDelay = route.arrivalDelay
			? ` (+${route.arrivalDelay})`
			: '';

		const busText = route.buses
			? ' | ' + busesToText(route.buses)
			: '';
		text += `Ab: ${dateToTime(route.departure)}${depDelay}, An: ${dateToTime(route.arrival)}${arrDelay}${busText}\n`;
	}

	return text;
}

function busesToText(buses) {
	let text = '';

	for (const bus of buses) {
		// const depDelay = bus.departureDelay
		// 	? ` (+${bus.departureDelay})`
		// 	: '';

		// const arrDelay = bus.arrivalDelay
		// 	? ` (+${bus.arrivalDelay})`
		// 	: '';

		text += `${bus.name} (${dateToTime(bus.departure)}), `;
	}

	return text;
}

// Parse a train journey's legs into our needed info
function parseJourney(journey) {
	const leg = journey.legs[0];
	const lastLeg = journey.legs[journey.legs.length - 1];

	return {
		departure: new Date(leg.departure),
		arrival: new Date(lastLeg.arrival),
		arrivalDelay: lastLeg.arrivalDelay, // delay is in seconds, acc. to docs
		departureDelay: leg.departureDelay
	};
}

// Get the buses to catch a given route/journey
async function busForJourney(journey) {
	const departure = journey.legs[0].departure;

	const { journeys } = await hafas.journeys(
		stations['Munstermannskamp'],
		stations['Lüneburg'],
		{
			results: 20,
			arrival: departure
		}
	);

	const buses = [];
	for (const journey of journeys) {
		if (journey.legs.length > 1)
			continue;

		const leg = journey.legs[0];
		const bus = {
			departure: new Date(leg.departure),
			arrival: new Date(leg.arrival),
			name: leg.line.name
		};

		// Minutes between train departure and bus arrival
		const trainDeparture = new Date(departure);
		const timeScore = (trainDeparture - bus.arrival) / (1000 * 60);

		// Time spent at train station should be less than 30 but more than 4 minutes long
		if (timeScore >= 30 || timeScore < 4)
			continue;

		buses.push(bus);
	}

	return buses;
}

// Converts JS date to normal time format (e.g. 15:45)
function dateToTime(date) {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}