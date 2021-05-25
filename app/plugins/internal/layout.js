module.exports = async function layoutPlugin({ sync, database }) {
	const initialLayout = [
		{ x: 0, y: 0, w: 12, h: 2, i: '0', component: 'basic-header', moved: false },
		{ x: 0, y: 8, w: 4, h: 3, i: '1', component: 'links', moved: false },
		{ x: 8, y: 8, w: 4, h: 10, i: '2', component: 'bahn', moved: false },
		{ x: 0, y: 2, w: 12, h: 4, i: '3', component: 'homebridgeSwitches', moved: false },
		{ x: 0, y: 8, w: 2, h: 7, i: '4', component: 'covid', moved: false }
	];
	const layout = database.get('layout', initialLayout);

	const service = sync.createService('dashboards', { layout });

	service.action('update')
		.requirePermission('update', 'dashboard', 'any')
		.validate(Joi => Joi.object())
		.handler(({ layout }, { setState }) => {
			setState({
				layout
			});

			database.set('layout', layout);
		});

	service.action('reset')
		.requirePermission('update', 'dashboard', 'any')
		.handler(({ layout }, { setState }) => {
			setState({
				layout: initialLayout
			});

			database.set('layout', initialLayout);
		});

	return {
		version: '0.0.1',
		description: 'Dashboard Layout Engine'
	};
};