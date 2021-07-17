const path = require('path');
const fs = require('fs/promises');
const EventEmitter = require('events');
const autoBind = require('auto-bind');

const PluginAPI = require('./PluginAPI');

const filterOutDisabledPlugins = (filename) => !filename.startsWith('_');


/**
 * Plugin manager that handles plugin loading and initialization.
 * @emits progress
 */
class Plugins extends EventEmitter {
	/**
	 * Create the plugin manager without loading plugins just yet.
	 * 
	 * @param  {PluginDependencies} modules - Modules Dependency Injection 
	 */
	constructor(modules) {
		super();

		const { sync, config, logging } = this.modules = modules;

		this.logger = logging.createLogger('Plugins');
		this.logger.debug('initializing plugins');

		this.pluginsDir = path.resolve(config.basePath, 'plugins');
		this.pluginService = this.setupPluginDataService(sync);
		this.plugins = {};

		autoBind(this);
	}

	async load() {
		const pluginPaths = await this.getPluginPaths();
		this.logger.debug('plugin paths:', pluginPaths);

		let finished = 0;
		const progressUpdate = () => {
			finished++;
			this.emit('progress', 0.75 + ((finished / pluginPaths.length) * 0.15));
		};

		try {
			//for (const pluginPath of pluginPaths) {
			const initPromises = pluginPaths
				.map(pluginPath => ({ path: pluginPath, name: path.parse(pluginPath).name }))
				.map(async ({ path, name }) => new Promise(async (resolve, reject) => {
					try {
						const pluginFactory = require(path);

						this.logger.debug('init plugin', name);

						// The context is the object, the plugin can use to access system internals
						const context = new PluginAPI(name, this.modules);

						// Register in internal plugins
						this.plugins[name] = {
							version: '0.0.0', // Version here so we have a default
							...await pluginFactory(context), // Init the plugin
							name // Name afterwards so it can't be overriden
						};

						// Call Action to reflect new plugins state
						this.modules.sync.invokeAction('plugins', 'add', {
							plugin: {
								name: this.plugins[name].name, 
								version: this.plugins[name].version, 
								description: this.plugins[name].description
							}
						});

						progressUpdate();
						this.logger.debug(`loaded plugin: ${name}, version: ${this.plugins[name].version || 'unknown'}`);

						resolve();
					} catch (e) {
						this.logger.error('error in plugin: ' + name, { error: e });
						reject(e);
					}
				}));

			// Wait til all plugins are initialized and loaded
			await Promise.allSettled(initPromises);

			this.logger.debug('all plugins initialized');
		} catch (e) {
			this.logger.error('plugins module failed', e);

			throw e;
		}
	}

	async getPluginPaths() {
		const defaultPluginsDir = path.resolve(__dirname, 'internal');

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
			this.logger.error('Could not read default plugin path', defaultPluginsDir, e);
		}

		try {
			const files = await fs.readdir(this.pluginsDir);

			// Make paths absolute
			paths = paths.concat(
				files
					.filter(filterOutDisabledPlugins)
					.map(file => path.resolve(this.pluginsDir, file))
			);
		} catch(e) {
			this.logger.error('Could not read plugin path', this.pluginsDir, e);
		}
		
		// TODO: Add paths from plugins globally installed via NPM

		return paths;
	}

	setupPluginDataService(sync) {
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

	plugin(name) {
		return this.plugins[name];
	}
}

module.exports = Plugins;