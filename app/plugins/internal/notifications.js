const superagent = require('superagent');

/**
 * Notification type
 *
 * @typedef {Notification}
 * @property {string} id        - UUID of notification
 * @property {string} type      - Type of notification
 * @property {string} createdAt - Date of creation
 * @property {string} title     - Notification title
 * @property {string} [body]    - Notification body text
 */

/**
 * Notifications service state
 *
 * @typedef {Record.<string, Notification[]>} NotificationServiceState
 */

module.exports = function initNotificationsPlugin({
	sync,
	logger,
	database,
	helpers,
}) {
	/**
	 * Notification service
	 *
	 * The notification service is responsible for keeping track of all notifications
	 * for all users.
	 * Notifications can be added and removed (read).
	 * Each user has a list of notifications in the service state.
	 * The state is filtered by the username of the current user, so that only
	 * the notifications for the current user are returned.
	 *
	 * When creating a notification, either a role or a username can be passed along with
	 * the notification type, title and body.
	 * When passing a `role`, the notification will be created for all users of that role.
	 * When passing a `username`, the notification will only be created for the given user.
	 *
	 * @service notifications
	 */
	const service = sync
		.createService(
			'notifications',
			/** @type {NotificationServiceState} */ {
				mat: {}
				/* notifications for user */
				// 'username': []
			}
		)
		.addFilter((state, { user }) => {
			// This filter filters out notifications of other users from service state,
			// so that only notifications of current user are shown.
			return {
				notifications: state[user.username] || [],
			};
		});

	/**
	 * Action to create a notification
	 *
	 * When creating a notification, either a role or a username can be passed along with
	 * the notification type, title and body.
	 * When passing a `role`, the notification will be created for all users of that role.
	 * When passing a `username`, the notification will only be created for the given user.
	 *
	 * @service notifications
	 * @action create
	 * @example
	 * 	// Create an error notification for all users of the role 'admin'
	 * 	await service.invoke('create', {
	 * 		type: 'error',
	 * 		title: 'Error',
	 * 		body: 'Something went wrong',
	 * 		role: 'admin'
	 * 	});
	 *
	 *
	 * @param {string} type - Type of notification
	 * @param {string} title - Notification title
	 * @param {string} [body] - Notification body text
	 * @param {string} [role] - User role to show notification to
	 * @param {string} [username] - Username of user to show notification to
	 * @returns {void}
	 */
	service
		.action('create')
		.requirePermission('create', 'notification', 'any')
		.validate((Joi) =>
			Joi.object({
				type: Joi.string().token().required(),
				title: Joi.string().required().max(255),
				body: Joi.string(),
				role: Joi.string().max(128),
				username: Joi.string().trim(),
			})
				.xor('role', 'username')
				.unknown(false)
		)
		.handler(async (notification, context) => {
			const id = helpers.uuid().toString();

			const users = notification.role
				? await database.api.users.all()
				: [await database.api.users.find(notification.username)];

			for (const user of users) {
				if (!user) continue;

				if (!context.state[user.username]) {
					context.state[user.username] = {};
				}

				context.state[user.username][id] = {
					...notification,
					createdAt: new Date().toISOString(),
					id,
				};
			}

			// TODO: (#37) Proper Hooks API after actions to react potentially to new notifications
			superagent
				.get('http://datenregal.local:4001/ble/mode/notification')
				.catch((e) =>
					logger.error(`Couldn't run LED notification mode`, {
						error: e,
					})
				);
		});

	/**
	 * Action to delete a notification
	 *
	 * If no username is passed, the notification will be deleted for the current user.
	 *
	 * TODO: Checks for custom permission because of standard permission API limitation. Investigate for improvement?
	 *
	 * @service notifications
	 * @action delete
	 * @example
	 * 	// Remove (mark as read) a notification for the current user (ommitted username)
	 * 	await service.invoke('delete', {
	 * 		id: '5e1c1c7c-c0f8-4f0e-a9e2-e7e8a9f4d1c2'
	 * 	});
	 *
	 * @param {string} id - UUID of notification
	 * @param {string} [username] - Username of user (defaults to user requesting action)
	 * @returns {void}
	 */
	service
		.action('delete')
		.validate((Joi) =>
			Joi.object({
				id: Joi.string().uuid().required(),
				username: Joi.string().trim(),
			})
		)
		.handler(
			async (
				{ id, username },
				{
					database,
					user: currentUser,
					permissions,
					state,
					UserError,
					AuthError,
				}
			) => {
				username = username || currentUser.username;

				let scope = 'any';
				if (username === currentUser.username) {
					scope = 'own';
				}

				// Check if current user can delete a notification.
				// Scope is 'any' if the notification is not the user's, otherwise it's 'own'.
				if (
					!permissions
						.can(currentUser.role)
						.delete('notification', scope).granted
				) {
					throw new AuthError(
						`${currentUser.role} can not delete ${scope} notification`
					);
				}

				// Only delete notifications for users that actually exist
				if (!(await database.api.users.find(username))) {
					throw new UserError(
						`User ${username} could not be found`,
						404
					);
				}

				// Check if the notification actually exists
				if (!state[username] || !state[username][id]) {
					throw new UserError(
						`Notification ${id} could not be found`,
						404
					);
				}

				// Delete notification from list
				delete state[username][id];
			}
		);

	return {
		internal: true,
		version: '1.0.0',
		description: 'Core plugin to enable notifications',
	};
};
