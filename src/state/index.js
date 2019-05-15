/*
 * The State Machine, heart and soul of mission control.
 *
 * The state maching is responsible for keeping the state for lights etc.
 * It works in a similar way that React/Redux works. But its simplified in that
 * reducers and actions are basically merged.
 * We have a store that holds all the data. This store is immutable.
 * To update data in the store, we need to define actions.
 * The actions will take the old state, and create a new one with updated data.
 * When an action is run / data is updated, the state machine's event emitter
 * sends a trigger that data has changed.
 * This will be broadcasted to internal services inside mission control or through
 * a Node-RED component. Node-RED flows can then update accordingly.
 *
 * This means, that the state machine resembles the SSOT (single source of truth).
 *
 * You can subscribe to specific data points in the state machine e.g.:
 * 		.subscribe('update:lights.desk')
 *		.subscribe('action:ACTION_NAME')
 * This will only trigger when any data within the lights.desk object changes.
 *
 * Actions Example:
 * function ACTION(oldState, actionData) {
 *     return Object.extend({}, oldState, { lampOn: actionData.isOn });
 * }
 *
 * Action names are always all caps to reduce errors when calling them.
 * An action cannot have side effects. HTTP requests and similar async tasks
 * are handled outside the state machine, to reduce complexity.
 */

const EventEmitter = require('eventemitter2');
const diff = require('object-diff');
const actions = require('./actions');

const log = require('@helpers/log').logger('State');

const emitter = new EventEmitter({
	wildcard: true,
	delimiter: ':'
});
let state = require('./initial-state');

// The subscribe method subscribes to a certain event and returns a function that,
// when invoked, will remove the subscription.
// If the passed event is '*' the listener will be subscribed to all events.
function subscribe(event, callback) {
	// Subscribe to event
	if (event === '*') {
		emitter.onAny(callback);
	} else {
		emitter.on(event, callback);
	}

	// Return function to unsubscribe
	return () => {
		if (event === '*') {
			emitter.offAny(callback);
		} else {
			emitter.removeListener(event, callback);
		}
	};
}

// The call method will run an action on the state with given arguments.
function callAction(actionKey, data) {
	log(`Executing action ${actionKey}`);

	// Normalize action name
	actionKey = actionKey.toUpperCase();

	// Throw an error if action doesn't exist
	if (!(actionKey in actions)) {
		throw new Error(`State machine could not find action '${actionKey}'.`);
	}

	const action = actions[actionKey];

	if (!action.validate(data))
		throw new Error(
			`Data for action '${actionKey}' is invalid (data: ${JSON.stringify(
				data
			)}).`
		);

	// Run the action with the old state
	const oldState = state;
	const newState = action.call(oldState, data);

	// We extend an empty object to remove all ties to the old state
	/*
	 * !!! ONLY TIME WE EVER SET STATE VARIABLE !!!
	 */
	state = Object.assign({}, newState);

	// Get a diff of the old and new state.
	// Using that diff we determine what the emitter should emit.
	// The state provided in update events that are limited to a key is
	// only the state that was updated.
	const stateDiff = diff(oldState, newState);
	Object.keys(stateDiff).forEach(changedKey => {
		emitter.emit(`update:${changedKey}`, {
			state: stateDiff
		});
	});

	// Emit a general state update event
	emitter.emit('update', {
		state: stateDiff,
		action: actionKey,
		diff: Object.keys(stateDiff)
	});
	emitter.emit(`action:${actionKey}`, {
		state: newState,
		action: actionKey,
		actionData: data,
		diff: Object.keys(stateDiff)
	});
}

function emitEvent(event, data) {
	emitter.emit(event, data);
}

module.exports = {
	getState: () => state,
	callAction,
	emitEvent,
	subscribe
};
