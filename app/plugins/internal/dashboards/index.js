const defaultDashboard = require('./default-dashboard');

module.exports = async function layoutPlugin({ sync, database }) {
	// const layout = database.get('layout', initialLayout);
	const mainLayout = database.get('layout:main-layout', defaultDashboard);

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
		main: mainLayout,
		componentProps: {
			'generic-info-block-28331': {
				label: 'System Version',
				service: 'telemetry',
				objectPath: 'stats.deviceName',
			},
		},
	});

	service
		.action('update')
		.requirePermission('update', 'dashboard', 'any')
		.validate((Joi) => Joi.object())
		.handler(({ main }, { setState }) => {
			setState({
				main,
			});

			database.set('layout:main-layout', main);
		});

	service
		.action('reset')
		.requirePermission('update', 'dashboard', 'any')
		.handler((data, { setState }) => {
			setState({
				main: defaultDashboard,
			});

			database.set('layout:main-layout', defaultDashboard);
		});

	return {
		version: '0.0.1',
		description: 'Dashboard Layout Engine',
	};
};
