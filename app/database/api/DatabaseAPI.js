/**
 * @module @database
 * @since 2.0.0
 */

const autoBind = require('auto-bind');

/**
 * The base class to build database API's on
 */
class DatabaseAPI {
	constructor(database) {
		/**
		 * Reference to the database class
		 * @type {Database}
		 */
		this.database = database;

		// Automatically bind all methods to "this"
		autoBind(this);
	}
}

module.exports = DatabaseAPI;