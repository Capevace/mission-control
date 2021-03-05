const path = require('path');
const fs = require('fs/promises');

const config = require('@config');
const logger = require('@helpers/logger').createLogger('Plugins');

const createPluginContext = require('./create-plugin-context');

const filterOutDisabledPlugins = filename => !filename.startsWith('_');

async function getPluginPaths() {
	const defaultPluginsDir = path.resolve(__dirname, 'internal');
	const pluginsDir = path.resolve(config.basePath, 'plugins');

	let paths = [];

	try {
		const files = await fs.readdir(defaultPluginsDir);

		// Make paths absolute
		paths = paths.concat(
			files
				.filter(filterOutDisabledPlugins)
				.map(file => path.resolve(defaultPluginsDir, file))
		);
	} catch(e) {
		logger.error('Could not read default plugin path', defaultPluginsDir, e);
	}

	try {
		const files = await fs.readdir(pluginsDir);

		// Make paths absolute
		paths = paths.concat(
			files
				.filter(filterOutDisabledPlugins)
				.map(file => path.resolve(pluginsDir, file))
		);
	} catch(e) {
		logger.error('Could not read plugin path', pluginsDir, e);
	}
	
	// TODO: Add paths from plugins globally installed via NPM

	return paths;
}

// PLUGIN
// name
//

let plugins = {};

module.exports = {
	async initPlugins(globalContext, updateProgress) {
		/**
		 * @ACTION
		 * Register a plugin
		 * @constant PLUGINS:ADD
		 * @property {{ name, version, description }} plugin The plugin.
		 * @example demo-action-call
		 */
		globalContext.state.registerReducer(
			'PLUGINS:ADD', 
			(state, plugin) => ({
				...state,
				plugins: {
					...state.plugins,
					[plugin.name]: plugin
				}
			}), 
			data => data
		);

		logger.debug('Initializing plugins');

		const pluginPaths = await getPluginPaths();
		logger.debug('Plugin paths:', pluginPaths);

		let finished = 0;
		function progressUpdate() {
			finished++;
			updateProgress('Finished plugin', 0.75 + ((finished / pluginPaths.length) * 0.15));
		}

		//for (const pluginPath of pluginPaths) {
		const initPromises = pluginPaths
			.map(async pluginPath => {
				return (async () => {
					try {
						const pluginFactory = require(pluginPath);

						const { name } = path.parse(pluginPath);

						logger.debug('Init plugin', name);

						// The context is the object, the plugin can use to access system internals
						const context = createPluginContext(name, globalContext);

						// Register in internal plugins
						plugins[name] = {
							version: '0.0.0',
							...await pluginFactory(context), // Init the plugin
							name
						};

						// Call Action to reflect new plugin state
						globalContext.state.invokeAction('PLUGINS:ADD', {
							name: plugins[name].name, 
							version: plugins[name].version, 
							description: plugins[name].description
						});

						progressUpdate();
						logger.debug(`Successfully loaded ${name} version ${plugins[name].version || 'unknown'}`);
					} catch (e) {
						logger.error('Could not init plugin at path', pluginPath, e);
						throw e;
					}
				})();
			});

		try {
			await Promise.allSettled(initPromises);

			logger.debug('Finished initializing plugins');
		} catch (e) {
			logger.error('Unknown error during plugin initialization', e);
		}
	},

	plugin(name) {
		return plugins[name];
	}
};