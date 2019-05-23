/**
 * The initial state object for the state machine.
 * @name  Initial State
 * @module @state/initial-state
 * @since 1.0.0
 */

/**
 * The initial state object for the state machine.
 *
 * @todo  Save state and load on launch.
 *
 * @type {Object}
 */
module.exports = {
	videoQueue: [],
	notifications: [],
	spotify: {
		accessToken: null,
		expiresAt: null
	},
	scenes: {
		movie: { name: 'Movie Night', active: false },
		chill: { name: 'Chill', active: false }
	}
};
