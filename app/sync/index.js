/**
 * ### Sync – The heart of mission-control
 *
 * Sync is the main logic of mission control. It hosts the global event loop and
 * is responsible for managing state and synchronising it with connected clients.
 * The state can include like system information, HomeKit devices or anything 
 * plugins wish to make available to all clients.
 *
 * The event loop holds two types of event:
 *  - base-event
 * 	- request
 *
 * A base-event handles like any other event. 
 * It will be called but won't want any response back.
 * Event handlers will be called asynchronously and no error is thrown if an
 * event doesn't have a listener.
 *
 * A request is an event that will expect a response.
 * If no event handler can be found or an error occurs in one of them,
 * the response will be an error object which clients can handle accordingly.
 *
 * **Note**: the sync engine does NOT send request events to other clients.
 * These events get filtered out, so request information leaks.
 * However, all base-events are broadcasted to all connected clients.
 *
 * When the State is changed, a `state:updated` base-event is dispatched,
 * with the changed state inside.
 * **Note**: There currently is no validation in state updates to detect data corruption
 * for example by events arriving out of sync. So far this has not led to any problems,
 * but these could definitely occur if enough users or actions get executed silmutaneously.
 * This should be looked at in the future @todo.
 *
 * To change the state, a `setState` function is exposed which is a bit like React's.
 * It takes one argument, the updated state, and will run `Object.assign` to the current
 * state to only update changed values.
 * **Note**: Bear in mind, that this only works one level deep.
 *
 * So you'll still need to do this:
 * ```js
 * setState({
 * 		myPlugin: {
 * 			...myPlugin,
 * 			change: 'bla'
 * 		}
 * });
 * ```
 *
 * @example
 * state.subscribe('update:lights.desk')
 * state.subscribe('action:ACTION_NAME')
 * @example
 * function ACTION(oldState, actionData) {
 *     return Object.extend({}, oldState, { lampOn: actionData.isOn });
 * }
 * @module @state
 * @since 1.0.0
 * @requires eventemitter2
 * @requires object-diff
 * @requires @state/initial-state
 */

const EventEmitter = require('eventemitter2');
const diff = require('object-diff');

// const ActionEvent = require('@state/events/ActionEvent');

const logger = require('@helpers/logger').createLogger('State', 'blueBright');

const emitter = new EventEmitter({
	wildcard: true,
	delimiter: ':'
});

module.exports = {

};

const eventBus = require('eventemitter2');

function 