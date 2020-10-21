const state = require('@state');
const db = require('@database');

module.exports = async function dashboardLayout() {
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

