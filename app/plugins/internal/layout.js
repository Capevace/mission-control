module.exports = async function layoutPlugin({ sync, database }) {
	const initialLayout = [
		{ x: 0, y: 0, w: 12, h: 2, i: '0', component: 'basic-header', moved: false },
		{ x: 0, y: 8, w: 4, h: 3, i: '1', component: 'links', moved: false },
		{ x: 8, y: 8, w: 4, h: 10, i: '2', component: 'bahn', moved: false },
		{ x: 0, y: 2, w: 12, h: 4, i: '3', component: 'homebridgeSwitches', moved: false },
		{ x: 0, y: 8, w: 2, h: 7, i: '4', component: 'covid', moved: false }
	];
	const initialResponsiveLayout = {
		lg: initialLayout,
		md: initialLayout,
		sm: initialLayout,
		xs: initialLayout,
		xxs: initialLayout
	};

	// const layout = database.get('layout', initialLayout);
	const mainLayout = database.get('layout:main-layout', initialResponsiveLayout);

	/**
	 * {
	 * 		lg:
	 * 		md:
	 * 		sm:
	 * 		xs:
	 * 		xxs:
	 * }
	 */

	const service = sync.createService('dashboards', { 
		main: mainLayout
	});

	service.action('update')
		.requirePermission('update', 'dashboard', 'any')
		.validate(Joi => Joi.object())
		.handler(({ layouts }, { setState }) => {
			setState({
				main: layouts
			});

			database.set('layout:main-layout', layouts);
		});

	service.action('reset')
		.requirePermission('update', 'dashboard', 'any')
		.handler(({ layout }, { setState }) => {
			setState({
				main: initialResponsiveLayout
			});

			database.set('layout:main-layout', initialResponsiveLayout);
		});

	return {
		version: '0.0.1',
		description: 'Dashboard Layout Engine'
	};
};