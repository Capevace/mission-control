const state = require('@state');
const db = require('@database');
const log = require('@helpers/log').logger('Layout');

module.exports = async function dashboardLayout() {
	const initialLayout = [
		{ x: 0, y: 0, w: 12, h: 2, i: '0', component: 'basicHeader', moved: false },
	    { x: 0, y: 2, w: 4, h: 5, i: '1', component: 'links', moved: false },
	    { x: 6, y: 3, w: 2, h: 5, i: '2', component: '', moved: false },
	    { x: 6, y: 8, w: 2, h: 3, i: '3', component: '', moved: false },
    	{ x: 8, y: 3, w: 4, h: 3, i: '4', component: '', moved: false }
	];

	const layout = db.get('layout', initialLayout);
	state.callAction('LAYOUT:UPDATE', {
		layout: layout
	});

	state.subscribe('action:LAYOUT:UPDATE', (data) => {
		db.set('layout', data.actionData.layout);
	});
};

