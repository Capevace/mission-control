const chalk = require('chalk');
const uuid = require('uuid/v4');

module.exports = function bahnInit({ sync, auth, state, logger, database }) {
	const service = sync.createService('notifications', {
		/* notifications for user */
		// 'username': []
	});

	service.action('create')
		.requirePermission('create', 'notification', 'any')
		.validate(Joi => 
			Joi.object({
				type: Joi.string()
					.token(),
				title: Joi.string()
					.required()
					.max(255),
				body: Joi.string(),
				role: Joi.string()
					.max(128),
				user: Joi.uuid()
			}).xor('role', 'user').unknown(false)
		)
		.handler(async (notification, context) => {
			let newState = {};

			if (notification.role) {
				const users = await database.api.users.findUser();

				for (const user of users) {
					newState[user.username] = [
						...(context.state[user] || {}),
						notification
					];
				}
			} else {
				const user = await database.api.users.findUser(notification.user);

				newState = {
					[user]: [
						...(context.state[user] || {}),
						notification
					]
				};
			}

			context.setState(newState);
		});

	service.action('delete')
		.requirePermission('delete', 'notification', 'any')
		.validate(Joi => Joi.uuid().required())
		.handler(async (notification, context) => {
			let newState = {};

			context.permissions.evaluate(context.user.role)

			if (notification.role) {
				const users = await database.api.users.findUser();

				for (const user of users) {
					newState[user.username] = [
						...(context.state[user] || {}),
						notification
					];
				}
			} else {
				const user = await database.api.users.findUser(notification.user);

				newState = {
					[user]: [
						...(context.state[user] || {}),
						notification
					]
				};
			}

			context.setState(newState);
		});

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