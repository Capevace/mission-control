const Logging = require('@helpers/logger');
const uuid = require('@helpers/uuid');
const autoBind = require('auto-bind');

/**
 * _Core_ is mission-control's main class and is responsible for initializing submodules
 * and managing dependency injection.
 *
 * **The main submodules are:**
 * 	- `config`: Mission Control configuration
 * 	- `logging`: Logging submodule
 * 	- `database`: Main database instance
 * 	- `auth`: Authentication & Permissions submodule
 * 	- `sync`: Sync (services & real-time state)
 * 	- `http`: HTTP submodule
 * 	- `socket`: Socket.io submodule
 * 	- `plugins`: Plugins submodule / custom apps outside of core
 *
 *
 * @class Core
 * @example
 * const core = new Core(config, logging);
 * await core.boot();
 */
module.exports = class Core {
	/**
	 * Create a new mission-control core.
	 */
	constructor(config, logging) {
		if (!config) {
			throw new Error('No config provided');
		}

		this.config = config;
		this.logging = logging || Logging;
		this.database = null;
		this.auth = null;
		this.sync = null;
		this.http = null;
		this.socket = null;
		this.plugins = null;

		autoBind(this);
	}

	progress(message, total) {}

	async boot() {
		const Database = require('@database/Database');
		this.database = new Database(this.config.databasePath);
		await this.database.init();

		let sessionSecret = this.database.get('session-secret', null);
		if (!sessionSecret) {
			// TODO: UUIDs are time-based so this is incredibly insecure.
			// Change this to some solid crypto random generation.
			sessionSecret = uuid();
			this.database.set('session-secret', sessionSecret);
		}

		this.progress('load auth', 0.1);

		const initAuth = require('./auth');
		this.auth = initAuth(this, sessionSecret);

		// Start the state machine
		this.progress('load sync', 0.2);

		const Sync = require('@sync/Sync');
		this.sync = new Sync(this);

		this.progress('load http & socket', 0.3);

		const HTTP = require('./http/HTTP');
		const initSocket = require('./socket');

		this.progress('start http', 0.4);

		// Initialize the main mission control http server
		this.http = new HTTP(this, sessionSecret);

		this.progress('start socket', 0.5);

		// Initialize the socket server
		this.socket = initSocket(this); // eslint-disable-line no-unused-vars

		this.progress('load plugins', 0.75);

		const Plugins = require('./plugins/Plugins');
		const plugins = new Plugins(this);
		plugins.on('progress', this.progress);

		await plugins.load();

		this.progress('http listen', 0.95);

		// Add error handler for plugin HTTP routes
		this.http.addErrorHandler();
		this.http.listen();

		this.progress('done', 1.0);
	}
};
