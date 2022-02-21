
module.exports = function dashboardExample(APP) {
	const { sync, logger, config, dashboard, http } = APP;

	const service = sync.createService('weed', {
		enabled: false,
		previousTheme: null,
		lastSpliff: null
	});

	service
		.action('toggle')
		.requirePermission('update', 'weed-mode', 'any')
		.validate((Joi) =>
			Joi.object({
				position: Joi.number().integer().min(0).default(26)
			})
		)
		.handler(async (data, { state }) => {
			state.enabled = !state.enabled;

			const themeService = sync.service('theme');
			if (state.enabled) {
				state.previousTheme = themeService.state.theme;
				state.lastSpliff = new Date();

				await themeService.invokeAction('choose', { theme: 'green' });
				await sync.service('spotify').invokeAction('play-kush', { position: data.position });
			} else {
				await themeService.invokeAction('choose', { theme: state.previousTheme });
				state.previousTheme = null;
			}
		});

	http.get('/cannabis.png', async (req, res) => {
		res.sendFile(__dirname + '/cannabis.png');
	});

	dashboard
		.component('weed')
		.custom(__dirname + '/weed.html');

	return {
		version: '0.0.1',
		description: 'Weed Mode'
	};
};