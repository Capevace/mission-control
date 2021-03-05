const chalk = require('chalk');
const uuid = require('uuid/v4');

module.exports = function bahnInit(APP) {
	const { state, logger } = APP;

	/**
	 * @ACTION
	 * Create a notification
	 * @constant NOTIFICATIONS:CREATE
	 * @property {string} title The title of the notification.
	 * @property {string} message The message of the notification.
	 * @example demo-action-call
	 */
	state.addAction(
		'NOTIFICATIONS:CREATE', 
		(state, { title, message }) => ({
			...state,
			notifications: [
				...state.notifications,
				{ title, message, unread: true, id: uuid(), date: new Date() }
			]
		}),
		(data) => ('title' in data) ? data : false
	);

	/**
	 * @ACTION
	 * Delete a notification.
	 * @constant NOTIFICATIONS:DELETE
	 * @property {string} id The id.
	 * @example demo-action-call
	 */
	state.addAction(
		'NOTIFICATIONS:DELETE', 
		(state, { id }) => {
			const newNotifications = state.notifications.filter(
				notification => notification.id !== id
			);

			return {
				...state,
				notifications: newNotifications
			};
		},
		(data) => ('id' in data) ? data : false
	);

	/**
	 * @ACTION
	 * Mark a notification as read.
	 * @constant NOTIFICATIONS:MARK-AS-READ
	 * @property {string} id The id.
	 * @example demo-action-call
	 */
	state.addAction(
		'NOTIFICATIONS:MARK-AS-READ', 
		(state, { id }) => {
			const newNotifications = state.notifications.map(notification =>
				notification.id === id
					? { ...notification, unread: false }
					: notification
			);

			return {
				...state,
				notifications: newNotifications
			};
		},
		(data) => ('id' in data) ? data : false
	);

	/**
	 * @ACTION
	 * Set all notifications. Used for clear-all effects.
	 * @constant NOTIFICATIONS:SET
	 * @property {array} notifications An array of notifications.
	 * @example demo-action-call
	 */
	state.addAction(
		'NOTIFICATIONS:SET', 
		(state, { notifications }) => {
			return {
				...state,
				notifications
			};
		},
		(data) => ('notifications' in data && Array.isArray(data.notifications)) ? data : false
	);


	state.subscribe(
		'action:NOTIFICATIONS:CREATE',
		({ actionData: { title, message } }) => {
			logger.info(`${chalk.bold(title)}: ${message}`);
		}
	);

	return {
		internal: true,
		version: '0.0.1',
		description: 'Internal Notification System'
	};
};