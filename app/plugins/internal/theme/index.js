const path = require('path');
const fs = require('fs/promises');
const si = require('systeminformation');
const publicIp = require('public-ip');
const pkg = require('@root/package.json');


module.exports = async function themes(APP) {
	const themeList = String(await fs.readFile(path.join(APP.config.dashboard.path, 'themes.json')));
	const themes = Object.keys(JSON.parse(themeList));

	const { sync, logger, database } = APP;

	const service = sync.createService('theme', {
		theme: database.get('theme', 'purple')
	});

	
	service.action('choose')
		.requirePermission('update', 'theme', 'any')
		.validate(Joi => Joi.object({
			theme: Joi.string().valid(...themes).required()
		}))
		.handler(async ({ theme }, { state, UserError }) => {
			logger.debug(`changing theme to: ${theme}`);

			state.theme = theme;
			database.set('theme', theme);
		});

	return {
		version: '0.0.1',
		description: 'Theme plugin'
	};
};