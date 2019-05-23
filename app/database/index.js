/**
 * Database Module
 * @module @database
 * @since 1.0.0
 */
const log = require('@helpers/log').logger('Database', 'cyan');
const storageConfig = require('@config').storage;
const fs = require('fs');

let database = {};

// If the storage folder doesnt exist, create it
if (!fs.existsSync(storageConfig.path)) {
	log("Storage folder doesn't exist. Creating /storage.");
	fs.mkdirSync(storageConfig.path);
}

// If the database.json file doenst exist, create it
// Otherwise, read from it and populate the database.
if (!fs.existsSync(storageConfig.databasePath)) {
	fs.writeFileSync(storageConfig.databasePath, '{}');
} else {
	database = require(storageConfig.databasePath);
}

/**
 * Set an object in the database to a given value.
 *
 * This function is used to save data permanently to the database.
 * Saves on every set.
 *
 * @todo  More object setting than 1 level deep.
 *
 * @param {String} key - The database object key to query. For now, only 1 level deep.
 * @param {any} value - The value you want to set.
 */
module.exports.set = function set(key, value) {
	database[key] = value;

	// Save the database to disk
	fs.writeFileSync(
		storageConfig.databasePath,
		JSON.stringify(database, null, 2),
		err => {
			if (err) log('Error writing Database file', err);
		}
	);
};

/**
 * Retrieve data from a database with a given key.
 *
 * @todo  multi-level getting
 *
 * @param  {String} key - The key to retrieve from the database. (1-level deep)
 * @return {Object} The object from the database.
 */
module.exports.get = function get(key, defaultValue) {
	return database[key] || defaultValue;
};
