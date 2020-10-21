const config = require('@config');
const state = require('@state');
const logger = require('@helpers/logger').createLogger('Plugins');

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);

async function isDirectory(path) {
	const stat = await lstat(path);

	return stat.isDirectory();
}

async function initializePlugins() {
	const pluginsDir = path.join(config.basePath, 'plugins');

	const pluginFiles = await readdir(pluginsDir);

	for (const pluginFile of pluginFiles) {
		if (pluginFile.startsWith('_')) {
			continue;
		}

		const pluginPath = path.join(pluginsDir, pluginFile);
		const isPluginFolder = await isDirectory(pluginPath);

		let plugins = [];
		const pluginStart = isPluginFolder
			? require(path.join(pluginPath, 'index.js'))
			: require(pluginPath);

		try {
			const pluginData = await pluginStart({
				config,
				state,
				// app,
				// dashboard: {
				// 	registerPage(path, title, componentName) {},
				// 	registerComponent() {}
				// }
			});
			plugins.push({
				active: true,
				id: pluginFile,
				...pluginData
			});
			logger.debug(`Plugin "${pluginData.name}" loaded successfully`);
		} catch (e) {
			plugins.push({
				active: false,
				error: e.message,
				id: pluginFile,
				name: pluginFile
			});
			logger.error(`Error loading plugin ${pluginFile}`, e);
		}

		return plugins;
	}
}

// module.exports = function pluginStart({ config, http, state, dashboard }) {

// 	dashboard.registerPage('/path', 'Title', 'component-name');
// 	dashboard.registerComponent('', '')



// 	return {
// 		name: 'HomeKit',
// 		version: '0.0.1'
// 	};
// }

module.exports = async function plugins() {
	const plugins = await initializePlugins();

	// state.subscribe('action:HOMEKIT:MODIFY-CHARACTERISTICS', async (context) => {
	// 	const { uniqueId, changes = {} } = context.actionData;

	// 	log(`Modifying characteristics in service ${uniqueId} with changes ${JSON.stringify(changes, null, 2)}`);

	// 	const services = await hap.getAllServices();
	// 	const service = services.find(service => service.uniqueId === uniqueId);
	// 	if (!service) {
	// 		log(`Could not find service with id: ${uniqueId}`);
	// 		return;
	// 	}

	// 	for (const characteristicName in changes) {
	// 		const newValue = changes[characteristicName];

	// 		const characteristic = service.getCharacteristic(characteristicName);

	// 		if (!characteristic || !characteristic.setValue) {
	// 			log(`Could not find characteristic with name: ${characteristicName}`);
	// 			continue;
	// 		}

	// 		characteristic.setValue(newValue);
	// 	}
	// });
};
