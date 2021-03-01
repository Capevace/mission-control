module.exports = async function layoutInit(APP) {
	const { state, database } = APP;

	/**
	 * @ACTION
	 * Update dashboard layout
	 *
	 * @constant LAYOUT:UPDATE
	 * @property {object} changes The data to be set
	 * @example
	 * state.run('LAYOUT:UPDATE', { layout: [] })
	 */
	state.registerAction(
		'LAYOUT:UPDATE', 
		(state, data) => ({
			...state,
			layout: data.layout
		}),
		(data) => (Array.isArray(data.layout)) ? data : false
	);

	/**
	 * @ACTION
	 * Reset the dashboard layout to defaults
	 *
	 * @constant LAYOUT:RESET
	 * @example
	 * state.run('LAYOUT:RESET')
	 */
	state.registerAction(
		'LAYOUT:RESET', 
		(state, data) => ({
			...state,
			layout: []
		}),
		(data) => true
	);


	const initialLayout = [
		{ x: 0, y: 0, w: 12, h: 2, i: '0', component: 'basicHeader', moved: false },
		{ x: 0, y: 8, w: 4, h: 3, i: '1', component: 'links', moved: false },
		{ x: 8, y: 8, w: 4, h: 10, i: '2', component: 'bahn', moved: false },
		{ x: 0, y: 2, w: 12, h: 4, i: '3', component: 'homekitSwitches', moved: false },
		{ x: 0, y: 8, w: 2, h: 7, i: '4', component: 'covid', moved: false }
	];

	const layout = database.get('layout', initialLayout);
	state.run('LAYOUT:UPDATE', {
		layout
	});

	state.subscribe('action:LAYOUT:UPDATE', (data) => {
		database.set('layout', data.actionData.layout);
	});

	state.subscribe('action:LAYOUT:RESET', () => {
		database.set('layout', initialLayout);
		state.run('LAYOUT:UPDATE', {
			layout: initialLayout
		});
	});

	return {
		internal: true,
		version: '0.0.1',
		description: 'Dashboard Layout Engine'
	};
};