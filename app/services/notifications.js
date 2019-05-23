const state = require('@state');
const logNotification = require('@helpers/log').custom();

const chalk = require('chalk');

module.exports = async function notifications() {
	state.subscribe(
		'action:NOTIFICATIONS:CREATE',
		({ actionData: { title, message } }) => {
			logNotification(
				chalk.black.bold.bgWhiteBright('[Notification]') +
					` ${chalk.bold(title)}: ${message}`
			);
		}
	);

	// state.subscribe('ifttt:webhook', () => {});
};
