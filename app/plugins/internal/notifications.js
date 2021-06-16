const chalk = require('chalk');
const uuid = require('uuid/v4');

/**
 * Notification type
 * 
 * @typedef {Notification}
 * @property {string} type - Type of notification
 * @property {string} title - Notification title
 * @property {string} [body] - Notification body text
 */

module.exports = function initNotificationsPlugin({ sync, auth, state, logger, database, helpers }) {
	const service = sync.createService('notifications', {
		/* notifications for user */
		// 'username': []
	}).addFilter((state, { user }) => {
		// Only pass the users notifications down
		return {
			[user.username]: state[user.username] || []
		};
	});

	service.action('create')
		.requirePermission('create', 'notification', 'any')
		.validate(Joi => 
			Joi.object({
				type: Joi.string()
					.token()
					.required(),
				title: Joi.string()
					.required()
					.max(255),
				body: Joi.string(),
				role: Joi.string()
					.max(128),
				username: Joi.string()
					.trim()
			}).xor('role', 'username').unknown(false)
		)
		.handler(async (notification, context) => {
			let newState = {};

			const id = helpers.uuid().toString();

			const users = notification.role
				? await database.api.users.all()
				: [await database.api.users.find(notification.username)];

			for (const user of users) {
				if (!user)
					continue;

				if (!context.state[user.username]) {
					context.state[user.username] = {};
				}

				context.state[user.username][id] = {
					...notification,
					createdAt: new Date().toISOString(),
					id
				};
			}
		});

	service.action('delete')
		.validate(Joi => Joi.object({
			id: Joi.string().uuid().required(),
			username: Joi.string()
				.trim()
		}))
		.handler(async ({ id, username }, { database, user: currentUser, permissions, state, UserError, AuthError }) => {
			username = username || currentUser.username;

			let scope = 'any';
			if (username === currentUser.username) {
				scope = 'own';
			}

			// Check if current user can delete a notification.
			// Scope is 'any' if the notification is not the user's, otherwise it's 'own'.
			if (!permissions.can(currentUser.role).delete('notification', scope).granted) {
				throw new AuthError(`${currentUser.role} can not delete ${scope} notification`);
			}

			// Only delete notifications for users that actually exist
			if (!(await database.api.users.find(username))) {
				throw new UserError(`User ${username} could not be found`, 404);
			}


			// Check if the notification actually exists
			if (!state[username] || !state[username][id]) {
				throw new UserError(`Notification ${id} could not be found`, 404);
			}

			// Delete notification from list
			delete state[username][id];
		});

	// /**
	//  * @ACTION
	//  * Delete a notification.
	//  * @constant NOTIFICATIONS:DELETE
	//  * @property {string} id The id.
	//  * @example demo-action-call
	//  */
	// state.addAction(
	// 	'NOTIFICATIONS:DELETE', 
	// 	(state, { id }) => {
	// 		const newNotifications = state.notifications.filter(
	// 			notification => notification.id !== id
	// 		);

	// 		return {
	// 			...state,
	// 			notifications: newNotifications
	// 		};
	// 	},
	// 	(data) => ('id' in data) ? data : false
	// );

	// /**
	//  * @ACTION
	//  * Mark a notification as read.
	//  * @constant NOTIFICATIONS:MARK-AS-READ
	//  * @property {string} id The id.
	//  * @example demo-action-call
	//  */
	// state.addAction(
	// 	'NOTIFICATIONS:MARK-AS-READ', 
	// 	(state, { id }) => {
	// 		const newNotifications = state.notifications.map(notification =>
	// 			notification.id === id
	// 				? { ...notification, unread: false }
	// 				: notification
	// 		);

	// 		return {
	// 			...state,
	// 			notifications: newNotifications
	// 		};
	// 	},
	// 	(data) => ('id' in data) ? data : false
	// );

	// /**
	//  * @ACTION
	//  * Set all notifications. Used for clear-all effects.
	//  * @constant NOTIFICATIONS:SET
	//  * @property {array} notifications An array of notifications.
	//  * @example demo-action-call
	//  */
	// state.addAction(
	// 	'NOTIFICATIONS:SET', 
	// 	(state, { notifications }) => {
	// 		return {
	// 			...state,
	// 			notifications
	// 		};
	// 	},
	// 	(data) => ('notifications' in data && Array.isArray(data.notifications)) ? data : false
	// );


	// state.subscribe(
	// 	'action:NOTIFICATIONS:CREATE',
	// 	({ actionData: { title, message } }) => {
	// 		logger.info(`${chalk.bold(title)}: ${message}`);
	// 	}
	// );

	return {
		internal: true,
		version: '0.0.1',
		description: 'Internal Notification System'
	};
};