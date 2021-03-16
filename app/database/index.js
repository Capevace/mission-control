/**
 * Database Module
 * @module @database
 * @since 1.0.0
 */
const logger = require('@helpers/logger').createLogger('Database', 'cyan');
const config = require('@config');
const fs = require('fs');

let database = {};

// If the storage folder doesnt exist, create it
if (!fs.existsSync(config.storagePath)) {
	logger.warn("Storage folder doesn't exist. Creating /storage.");
	fs.mkdirSync(config.storagePath, { recursive: true });
}

// If the database.json file doenst exist, create it
// Otherwise, read from it and populate the database.
if (!fs.existsSync(config.databasePath)) {
	fs.writeFileSync(config.databasePath, '{}');
} else {
	database = require(config.databasePath);
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
		config.databasePath,
		JSON.stringify(database, null, 2),
		err => {
			if (err) logger.error('Error writing database file', err);
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

const defaultUser = { 
	username: 'mat', 
	password: 'mat', 
	avatarUrl: 'https://media1.tenor.com/images/485b6e253f0074fd62aea7eff6a6427d/tenor.gif', 
	displayName: 'Lukas'
};

/**
 * Database API for more common tasks
 */
const api = {
	getUsers() {
        return module.exports.get('users', { [defaultUser.username]: defaultUser });
	},
	updateUser(user) {
		let users = api.getUsers();
		users[user.username] = {
			// TODO Users without passwords can be created here, possibly unsafe
			...(users[user.username] || {}),
			...user
		};

		module.exports.set('users', users);
	}
};
module.exports.api = api;
