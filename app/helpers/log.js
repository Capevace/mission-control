/**
 * Logging Helpers
 * @module @helpers/log
 * @requires chalk, qrcode-terminal
 */

const chalk = require('chalk');
const qrcode = require('qrcode-terminal');

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
 * Ouput the styled ready message including a QR code that leads to the base url.
 *
 * @param  {String} url - The url to encode and log.
 * @param  {String} authUrl - The auth url to display.
 */
module.exports.logReadyMessage = function logReadyMessage(url, authUrl) {
	qrcode.generate(url, { small: true }, function (qrCode) {
		const message =
`
.  . .-. .-. .-. .-. .-. . .   .-. .-. . . .-. .-. .-. .   
|\\/|  |  \`-. \`-.  |  | | |\\|   |   | | |\\|  |  |(  | | |   
'  \` \`-' \`-' \`-' \`-' \`-' ' \`   \`-' \`-' ' \`  '  ' ' \`-' \`-' 
       
${qrCode}

Dashboard available at ${module.exports.format('cyan', url)}
SSO available at ${module.exports.format('cyan', authUrl)}
`;

			console.log(message); // eslint-disable-line no-console
		});
};

/**
 * Create a custom logger function to use for console output without any title or styling.
 *
 * @return {Function} A function that you can call to log things.
 */
module.exports.custom = function custom() {
	return (...args) => console.log(...args); // eslint-disable-line no-console
};
