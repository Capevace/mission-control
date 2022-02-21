const defaultDashboard = require('./default-dashboard');
const defaultProps = require('./default-props');


module.exports = async function layoutPlugin({ sync, database }) {
	// const layout = database.get('layout', initialLayout);
	
	const dbMainLayout = database.get('layout:main-layout', defaultDashboard);
	const dbProps = database.get('dashboard:component-props', defaultProps);

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
		main: dbMainLayout,
		componentProps: dbProps
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
		.action('add-component')
		.requirePermission('create', 'dashboard:widget', 'any')
		.validate(Joi => Joi.object({
			type: Joi.string()
				.trim()
				.required(),
			props: Joi.object()
				.required()
		}))
		.handler(({ type, props }, { state, setState }) => {
			const componentId = `${type}-${Math.floor(
				Math.random() * 100000
			)}`;

			for (const breakpoint of Object.keys(state.main)) {
				const minY = state.main[breakpoint].reduce(
					(minY, component) => {
						const localMinY = component.y + component.h;

						return minY < localMinY ? localMinY : minY;
					},
					0
				);

				state.main[breakpoint].push({
					x: 0,
					y: minY,
					w: 6,
					h: 9,
					i: componentId,
					component: type,
					moved: false,
				});
			}

			state.componentProps[componentId] = { ...props };

			database.set('dashboard:component-props', state.componentProps);
		});

	service
		.action('delete-component')
		.requirePermission('delete', 'dashboard:widget', 'any')
		.validate(Joi => Joi.object({
			id: Joi.string()
				.trim()
				.required()
		}))
		.handler(({ id }, { state, setState, UserError }) => {
			let main = state.main;
			let props = state.componentProps;

			for (const breakpoint of Object.keys(main)) {
				const index = main[breakpoint].findIndex((component) => component.i === id);

				if (index !== -1) {
					main[breakpoint].splice(index, 1);
				} else {
					throw new UserError('Component not found', 404);
				}
			}

			delete props[id];

			setState({
				main,
				componentProps: props
			});

			database.set('layout:main-layout', main);
			database.set('dashboard:component-props', props);
		});

	service
		.action('edit-component-props')
		.requirePermission('update', 'dashboard:widget', 'any')
		.validate(Joi => Joi.object({
			id: Joi.string()
				.trim()
				.required(),
			props: Joi.object()
				.required()
		}))
		.handler(({ id, props }, { state, setState, UserError }) => {
			if (!(id in state.componentProps)) {
				throw new UserError('Component not found', 404);
			}

			state.componentProps[id] = props;

			database.set('dashboard:component-props', state.componentProps);
		});

	service
		.action('reset')
		.requirePermission('update', 'dashboard', 'any')
		.handler((data, { setState }) => {
			setState({
				main: defaultDashboard,
			});

			database.set('layout:main-layout', defaultDashboard);
			database.set('dashboard:component-props', defaultProps);
		});

	return {
		version: '0.0.1',
		description: 'Dashboard Layout Engine',
	};
};
