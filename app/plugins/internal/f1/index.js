const ical = require('node-ical');

const nameRegex = /(.*) - (.*)/;

function parseF1Calendar(events, includeAfter) {
	const tracks = {};
	const weekends = {};

	for (const event of events) {
		if (!event.summary || event.end < includeAfter) continue;

		const match = event.summary.split(' - ');

		if (!match) {
			console.log('lol', event);
			continue;
		}

		const track = {
			name: match[0],
		};

		const session = {
			id: event.uid,
			name: match[1],
			start: event.start,
			end: event.end,
			track: track,
		};

		let weekend = weekends[match[0]];

		if (weekend) {
			weekend.sessions.push(session);

			if (session.start < weekend.start) {
				weekend.start = session.start;
			}

			if (weekend.end < session.end) {
				weekend.end = session.end;
			}
		} else {
			weekend = {
				track,
				start: session.start,
				end: session.end,
				sessions: [session],
			};
		}

		weekends[match[0]] = weekend;
	}

	const sortedWeekends = Object.values(weekends).sort(
		(a, b) => a.start - b.start
	);

	return {
		weekends: sortedWeekends,
		nextSession: (sortedWeekends[0] || { sessions: [] }).sessions[0],
	};
}

/**
 * @typedef {Object} RaceTrack
 * @property {string} name - The name of the track
 * @property {string} location - The location the track is located in
 */

/**
 * @typedef {Object} RaceSession
 * @property {string}    id    - Session identifier
 * @property {string}    name  - The session type (Practice 1, Practice 2, ..., Race)
 * @property {RaceTrack} track - Location name
 * @property {Date}      start - The start time of the session
 * @property {Date}      end   - The end time of the session
 */

/**
 * @typedef {Object} RaceWeekend
 * @property {RaceTrack} 			track		- Location name
 * @property {Date}      			start		- The start date of the race weekend
 * @property {Date}               	end 	 	- The end date of the race weekend
 * @property {Array<RaceSession>} 	sessions 	- The sessions of the weekend (friday, saturday, sunday)
 */

module.exports = function f1Plugin({ dashboard, sync }) {
	// ICS to JSON events
	const rawEvents = Object.values(
		ical.sync.parseFile(__dirname + '/data/formula-1-races.ics')
	);

	// Group events by weekend/location
	const { weekends, nextSession } = parseF1Calendar(rawEvents, new Date());

	const service = sync.createService('f1', {
		/**
		 * @type {RaceSession}
		 */
		nextSession,

		/**
		 * @type {Array<RaceWeekend>}
		 */
		weekends,
	});

	// Check for new events every 5 minutes
	setInterval(() => {
		const { weekends, nextSession } = parseF1Calendar(
			rawEvents,
			new Date()
		);

		service.setState({
			nextSession,
			weekends,
		});
	}, 1000 * 60 * 5);

	dashboard.component('f1').custom(__dirname + '/widget.html');

	return {
		internal: true,
		version: '0.0.1',
		description: 'F1 data yay',
	};
};
