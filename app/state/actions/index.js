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
	 * Update the Spotify access token thats saved in the database and state.
	 *
	 * @constant SPOTIFY:UPDATE-TOKEN
	 * @property {string} accessToken The access token to update.
	 * @property {Date} expiresAt The date the access token expires at.
	 * @property {string} refreshToken The token to request a new access token with.
	 * @example demo-action-call
	 */
	'SPOTIFY:UPDATE-TOKEN',

	/**
	 * Update the system info statistics table.
	 *
	 * @constant SYSTEM-INFO:UPDATE
	 */
	'SYSTEM-INFO:UPDATE',

	/**
	 * Toggle a scene. Dummy for now.
	 *
	 * @constant SCENE:TOGGLE
	 * @property {string} scene The name of the scene.
	 * @property {bool} active Wether the scene is on or not.
	 * @example demo-action-call
	 */
	'SCENE:TOGGLE',

	/**
	 * Push a video onto the video queue.
	 *
	 * @constant VIDEO-QUEUE:PUSH
	 * @property {Object} video The video object to push onto the queue.
	 * @property {string} video.url The url to download the file from.
	 * @property {string} video.format The format to download the file as.
	 * @example
	 * state.callAction('VIDEO-QUEUE:PUSH', { video: { url: 'https://...', format: 'mp4' || 'mp3' || 'm4a' } })
	 */
	'VIDEO-QUEUE:PUSH',

	/**
	 * Update the progress for a video on the queue.
	 *
	 * @constant VIDEO-QUEUE:PROGRESS
	 * @property {string} videoUrl The video url to update the progress on.
	 * @property {Object} progress The progress object.
	 * @property {number} progress.downloaded The downloaded number of bytes.
	 * @property {number} progress.totalBytes The total number of bytes.
	 * @property {number} progress.state A status message.
	 * @example
	 * state.callAction('VIDEO-QUEUE:PROGRESS', {
	 *     videoUrl: 'https://..',
	 *     progress: {
	 *         downloaded: 30,
	 *         totalBytes: 100, // 30%,
	 *         state: 'downloading'
	 *     }
	 * }})
	 */
	'VIDEO-QUEUE:PROGRESS',

	/**
	 * Remove a video from the queue because it is finished or errored out.
	 *
	 * @constant VIDEO-QUEUE:FINISHED
	 * @property {string} videoUrl The video url to remove from the queue.
	 * @example demo-action-call
	 */
	'VIDEO-QUEUE:FINISHED',

	/**
	 * Set the devices homebridge sees
	 *
	 * @constant HOMEKIT:SET-SERVICES
	 * @property {Object} service The video object to push onto the queue.
	 * @property {string} service.uniqueId A unique ID for the service.
	 * @property {number} service.iid A unique ID for the service (used for identification internally).
	 * @property {string} service.name Name of the service
	 * @property {string} service.type Type of the service
	 * @property {Array} service.characteristics Array of characteristics
	 * @property {Array} service.values Array of values for the characteristics
	 * @example
	 * state.callAction('HOMEKIT:SET-SERVICES', { services: { 'serviceID': { ...service }}})
	 */
	'HOMEKIT:SET-SERVICES',

	/**
	 * Set homebridge config initialization state to indicate wether the pin is configured.
	 *
	 * @constant HOMEKIT:SET-INITIALIZED
	 * @property {Boolean} initialized 
	 * @example
	 * state.callAction('HOMEKIT:SET-INITIALIZED', { initialized: false })
	 */
	'HOMEKIT:SET-INITIALIZED',

	/**
	 * Set the devices homebridge sees
	 *
	 * @constant HOMEKIT:MODIFY-CHARACTERISTICS
	 * @property {number} uniqueId The service ID
	 * @property {object} changes The changes to be applied
	 * @example
	 * state.callAction('HOMEKIT:MODIFY-CHARACTERISTICS', { uniqueId: 0, changes: { 'On': false }})
	 */
	'HOMEKIT:MODIFY-CHARACTERISTICS',

	/**
	 * Update Deutsche Bahn route data
	 *
	 * @constant BAHN:UPDATE
	 * @property {object} changes The data to be set
	 * @example
	 * state.callAction('BAHN:UPDATE', { })
	 */
	'BAHN:UPDATE',

	/**
	 * Update dashboard layout
	 *
	 * @constant LAYOUT:UPDATE
	 * @property {object} changes The data to be set
	 * @example
	 * state.callAction('LAYOUT:UPDATE', { layout: [] })
	 */
	'LAYOUT:UPDATE'
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
