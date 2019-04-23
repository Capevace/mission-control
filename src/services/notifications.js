const config = require('@config');
const database = require('@database');
const state = require('@state');
const log = require('@helpers/log').logger('Notifications');

const chalk = require('chalk');
const logNotification = require('@helpers/log').custom();

const uuid = require('uuid/v4');

module.exports = async function notifications() {
	state.subscribe('action:CREATE_NOTIFICATION', ({ title, message }) => {
		logNotification(
			chalk.black.bold.bgWhiteBright('[Notification]') +
				` ${chalk.bold(title)}: ${message}`
		);
	});

	// Mark notification with id as read
	state.subscribe('notification:read', ({ id }) => {
		const notifications = database
			.get('notifications', [])
			.map(notification =>
				notification.id === id
					? { ...notification, unread: false }
					: notification
			);
	});

	// Remove notification with id from list
	// state.subscribe('notification:remove', ({ id }) => {
	// 	const notifications = database
	// 		.get('notifications', [])
	// 		.filter(notification => notification.id !== id);

	// 	database.set('notifications', notifications);
	// 	state.callAction('SET_NOTIFICATIONS', { notifications });
	// });

	state.subscribe('ifttt:webhook', () => {});
};
