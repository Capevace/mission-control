/**
 * The Actions.
 *
 * Actions are function that update the state in a way.
 * Since the state is immutable, they create new instances every time.
 * Actions always have a namespace like 'NOTIFICATIONS' and a quick action
 * word like 'CREATE' concatenated by a ':'.
 *
 * @module @state/actions
 */

const actionIdToPath = actionId =>
	actionId
		.replace(/:/g, '/')
		.replace(/_/g, '-')
		.toLowerCase();

const rawActions = [
	/**
	 * Play/pause the Kodi player.
	 * @constant KODI:RUN
	 * @property {string} command The command to execute.
	 * @property {array} args The arguments to pass along.
	 * @example demo-action-call
	 */
	'KODI:RUN',

	/**
	 * Create a notification
	 * @constant NOTIFICATIONS:CREATE
	 * @property {string} title The title of the notification.
	 * @property {string} message The message of the notification.
	 * @example demo-action-call
	 */
	'NOTIFICATIONS:CREATE',

	/**
	 * Delete a notification.
	 * @constant NOTIFICATIONS:DELETE
	 * @property {string} id The id.
	 * @example demo-action-call
	 */
	'NOTIFICATIONS:DELETE',

	/**
	 * Mark a notification as read.
	 * @constant NOTIFICATIONS:MARK-AS-READ
	 * @property {string} id The id.
	 * @example demo-action-call
	 */
	'NOTIFICATIONS:MARK-AS-READ',

	/**
	 * Set all notifications. Used for clear-all effects.
	 * @constant NOTIFICATIONS:SET
	 * @property {array} notifications An array of notifications.
	 * @example demo-action-call
	 */
	'NOTIFICATIONS:SET',

	/**
	 * Update the system info statistics table.
	 *
	 * @constant SYSTEM-INFO:UPDATE
	 */
	'SYSTEM-INFO:UPDATE'
];

// Take the actions and require their respective js files.
// *
//  * [actions description]
//  * @type {Array<string>}
const actions = rawActions.reduce(
	(allActions, action) => ({
		...allActions,
		[action]: require(`./${actionIdToPath(action)}`)
	}),
	{}
);

module.exports = actions;
