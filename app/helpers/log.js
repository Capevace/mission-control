/**
 * Logging Helpers
 * @module @helpers/log
 * @requires chalk
 */

const chalk = require('chalk');

/**
 * Create a logger function to use for console output.
 *
 * @param  {String} title - The title for the logger.
 * @param  {String} color - The color for the output. Defaults to blue.
 * @return {Function} A function that you can call to log things.
 */
module.exports.logger = function logger(title, color = 'blue') {
	return (...args) => console.log(`[${chalk[color](title)}]`, ...args);
};

/**
 * Create a custom logger function to use for console output without any title or styling.
 *
 * @return {Function} A function that you can call to log things.
 */
module.exports.custom = function custom() {
	return (...args) => console.log(...args);
};
