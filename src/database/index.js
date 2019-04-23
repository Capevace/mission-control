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

module.exports = {
	set(key, value) {
		database[key] = value;

		// Save the database to disk
		fs.writeFileSync(
			storageConfig.databasePath,
			JSON.stringify(database, null, 2),
			err => {
				if (err) log('Error writing Database file', err);
			}
		);
	},
	get(key, defaultValue) {
		return database[key] || defaultValue;
	}
};
