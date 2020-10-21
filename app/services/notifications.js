const state = require('@state');
const logger = require('@helpers/logger').createLogger('Notification', 'bold');

const chalk = require('chalk');

module.exports = async function notifications() {
	state.subscribe(
		'action:NOTIFICATIONS:CREATE',
		({ actionData: { title, message } }) => {
			logger.info(`${chalk.bold(title)}: ${message}`);
		}
	);

	// state.subscribe('ifttt:webhook', () => {});
};
