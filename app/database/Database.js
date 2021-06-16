/**
 * @module @database
 * @since 2.0.0
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const autoBind = require('auto-bind');

const UsersAPI = require('@database/api/UsersAPI');

/**
 * The Database object
 * Currently the "Database" is pretty much a JSON key value store.
 * However this will be updated when switching to SQLite
 * https://github.com/Capevace/mission-control/issues/17
 */
class Database {
	constructor(databasePath) {
		/**
		 * The databases data. This will change and is temporary
		 * @protected
		 * @type {object}
		 */
		this.data = {};

		/**
		 * The path to the database file
		 * @type {string}
		 */
		this.path = databasePath;

		/**
		 * The available Database API's for safe db usage
		 * @typedef {DatabaseAPIList}
		 */
		this.api = {
			/**
			 * The users API
			 * @type {UsersAPI}
			 */
			users: new UsersAPI(this)
		};

		autoBind(this);
	}

	/**
	 * Init connection to database etc.
	 */
	async init() {
		this.data = require(this.path);

		for (const api of Object.values(this.api)) {
			await api.init();
		}
	}

	/**
	 * Save the data to disk.
	 * TODO: This is bad but will be fixed with the switch to SQLite,
	 * so it's a very temporary solution.
	 * @protected
	 */
	_saveData() {
		fsSync.writeFileSync(
			this.path,
			JSON.stringify(this.data, null, 2),
			err => {
				if (err) logger.error('Error writing database file', err);
			}
		);
	}

	/**
	 * Set a value for a key in the database.
	 *
	 * The function synchronously saves the new data to disk as well.
	 * Quite the performance bottleneck for now and DEFINIETLY not safe at all
	 * like wtf. But works for now.
	 * 
	 * @param {string} key   - The key to set
	 * @param {any}    value - The value to set
	 */
	set(key, value) {
		this.data[key] = value;

		// Save the database to disk
		this._saveData();
	}

	/**
	 * Retrieve data from a database with a given key.
	 *
	 * @todo  multi-level getting
	 *
	 * @param  {string} key                   - The key to retrieve from the database. (1-level deep)
	 * @param  {any}    [defaultValue = null] - The default value if no value was found.
	 * @return {any}                          - The data from the database.
	 */
	get(key, defaultValue = null) {
		return this.data[key] || defaultValue;
	}
}

Database.verifyOrCreateDatabaseAt = async function verifyOrCreateDatabaseAt(databasePath) {
	// If the database.json file doenst exist, create it
	// Otherwise, read from it and populate the database.
	if (!(await fs.exists(databasePath))) {
		await fs.writeFile(databasePath, '{}');
	}
};


module.exports = Database;

