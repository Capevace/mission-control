/**
 * Logging Helpers
 * @module @helpers/log
 * @requires chalk
 */

const chalk = require('chalk');

/**
 * Color some text
 *
 * @param  {String} color - The color for the output. Defaults to blue.
 * @param  {String} text - The text
 * @return {String} The colored text.
 */
module.exports.format = function format(color, text) {
	return chalk[color] ? chalk[color](text) : text;
};

/**
 * Create a logger function to use for console output.
 *
 * @param  {String} title - The title for the logger.
 * @param  {String} color - The color for the output. Defaults to blue.
 * @return {Function} A function that you can call to log things.
 */
module.exports.logger = function logger(title, color = 'blue') {
	return (...args) => console.log(`[${module.exports.format(color, title)}]`, ...args); // eslint-disable-line no-console
};

/**
 * Create a logger function to use for outputting errors.
 *
 * @param  {String} title - The title for the logger.
 * @param  {Array} args - The messages you want to output.
 */
module.exports.error = function error(title, ...args) {
	console.log(`[${module.exports.format('red', title)}]`, ...args); // eslint-disable-line no-console
};

/**
 * Create a custom logger function to use for console output without any title or styling.
 *
 * @return {Function} A function that you can call to log things.
 */
module.exports.custom = function custom() {
	return (...args) => console.log(...args); // eslint-disable-line no-console
};
