const state = require('@state');
const logger = require('@helpers/logger').createLogger('Notification', 'bold');

const chalk = require('chalk');
const uuid = require('uuid/v4');

async function notificationsInit() {
	state.subscribe(
		'action:NOTIFICATIONS:CREATE',
		({ actionData: { title, message } }) => {
			logger.info(`${chalk.bold(title)}: ${message}`);
		}
	);

	// state.subscribe('ifttt:webhook', () => {});
};


module.exports = {
	actions: {
		/**
		 * Create a notification
		 * @constant NOTIFICATIONS:CREATE
		 * @property {string} title The title of the notification.
		 * @property {string} message The message of the notification.
		 * @example demo-action-call
		 */
		'NOTIFICATIONS:CREATE': {
			update(state, { title, message }) {
				return {
					...state,
					notifications: [
						...state.notifications,
						{ title, message, unread: true, id: uuid(), date: new Date() }
					]
				};
			},
			validate(data) {
				if ('title' in data) return data;

				return false;
			}
		},

		/**
		 * Delete a notification.
		 * @constant NOTIFICATIONS:DELETE
		 * @property {string} id The id.
		 * @example demo-action-call
		 */
		'NOTIFICATIONS:DELETE': {
			update(state, { id }) {
				const newNotifications = state.notifications.filter(
					notification => notification.id !== id
				);

				return {
					...state,
					notifications: newNotifications
				};
			},
			validate(data) {
				if ('id' in data) return data;

				return false;
			}
		},

		/**
		 * Mark a notification as read.
		 * @constant NOTIFICATIONS:MARK-AS-READ
		 * @property {string} id The id.
		 * @example demo-action-call
		 */
		'NOTIFICATIONS:MARK-AS-READ': {
			update(state, { id }) {
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
			validate(data) {
				if ('id' in data) return data;

				return false;
			}
		},

		/**
		 * Set all notifications. Used for clear-all effects.
		 * @constant NOTIFICATIONS:SET
		 * @property {array} notifications An array of notifications.
		 * @example demo-action-call
		 */
		'NOTIFICATIONS:SET': {
			update(state, { notifications }) {
				return {
					...state,
					notifications
				};
			},
			validate(data) {
				if ('notifications' in data && Array.isArray(data.notifications))
					return data;

				return false;
			}
		}
	},
	init: notificationsInit
};