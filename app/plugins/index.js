const path = require('path');
const fs = require('fs/promises');

const config = require('@config');
const logger = require('@helpers/logger').createLogger('Plugins');

const PluginContext = require('./plugin-context');

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

let plugins = {};

function setupPluginDataService(sync) {
	const service = sync.createService('plugins', {
		plugins: {}
	});

	service.action('add')
		.requirePermission('create', 'plugin', 'any')
		.handler(({ plugin }, context) => {
			context.state.plugins[plugin.name] = plugin;
		});

	return service;
}

module.exports = {
	async initPlugins(modules, updateProgress) {
		const { auth, http, sync, database, config } = modules;

		logger.debug('initializing plugins');

		const pluginDataService = setupPluginDataService(sync);

		const pluginPaths = await getPluginPaths();
		logger.debug('plugin paths:', pluginPaths);

		let finished = 0;
		function progressUpdate() {
			finished++;
			updateProgress('finished plugin', 0.75 + ((finished / pluginPaths.length) * 0.15));
		}

		try {
			//for (const pluginPath of pluginPaths) {
			const initPromises = pluginPaths
				.map(pluginPath => ({ path: pluginPath, name: path.parse(pluginPath).name }))
				.map(async ({ path, name }) => {
					return (async () => {
						try {
							const pluginFactory = require(path);

							logger.debug('init plugin', name);

							// The context is the object, the plugin can use to access system internals
							const context = new PluginContext(name, modules);

							// Register in internal plugins
							plugins[name] = {
								version: '0.0.0', // Version here so we have a default
								...await pluginFactory(context), // Init the plugin
								name // Name afterwards so it can't be overriden
							};

							// Call Action to reflect new plugins state
							sync.invokeAction('plugins', 'add', {
								plugin: {
									name: plugins[name].name, 
									version: plugins[name].version, 
									description: plugins[name].description
								}
							});

							progressUpdate();
							logger.debug(`loaded plugin: ${name}, version: ${plugins[name].version || 'unknown'}`);
						} catch (e) {
							logger.error('error in plugin: ' + name, { error: e });
							throw e;
						}
					})();
				});
			// Wait til all plugins are initialized and loaded
			await Promise.allSettled(initPromises);

			logger.debug('all plugins initialized');
		} catch (e) {
			logger.error('plugins module failed', e);
		}
	},

	plugin(name) {
		return plugins[name];
	}
};