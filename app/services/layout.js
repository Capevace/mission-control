const state = require('@state');
const db = require('@database');

async function layoutInit() {
	const initialLayout = [
		{ x: 0, y: 0, w: 12, h: 2, i: '0', component: 'basicHeader', moved: false },
		{ x: 0, y: 8, w: 4, h: 3, i: '1', component: 'links', moved: false },
		{ x: 8, y: 8, w: 4, h: 10, i: '2', component: 'bahn', moved: false },
		{ x: 0, y: 2, w: 12, h: 4, i: '3', component: 'homekitSwitches', moved: false },
		{ x: 0, y: 8, w: 2, h: 7, i: '4', component: 'covid', moved: false }
	];

	const layout = db.get('layout', initialLayout);
	state.callAction('LAYOUT:UPDATE', {
		layout
	});

	state.subscribe('action:LAYOUT:UPDATE', (data) => {
		db.set('layout', data.actionData.layout);
	});

	state.subscribe('action:LAYOUT:RESET', () => {
		db.set('layout', initialLayout);
		state.callAction('LAYOUT:UPDATE', {
			layout: initialLayout
		});
	});
};

module.exports = {
	actions: {
		/**
		 * Update dashboard layout
		 *
		 * @constant LAYOUT:UPDATE
		 * @property {object} changes The data to be set
		 * @example
		 * state.callAction('LAYOUT:UPDATE', { layout: [] })
		 */
		'LAYOUT:UPDATE': {
			update(state, data) {
				return {
					...state,
					layout: data.layout
				};
			},
			validate(data) {
				if (Array.isArray(data.layout)) return data;

				return false;
			}
		},

		/**
		 * Reset the dashboard layout to defaults
		 *
		 * @constant LAYOUT:RESET
		 * @example
		 * state.callAction('LAYOUT:RESET')
		 */
		'LAYOUT:RESET': {
			update(state) {
				return {
					...state,
					layout: []
				};
			},
			validate() {
				return true;
			}
		}
	},
	init: layoutInit
};