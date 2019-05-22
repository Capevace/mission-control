const MissionControlEvent = require('./MissionControlEvent');

class ActionEvent extends MissionControlEvent {
	/**
	 * @param  {String} action - The action key.
	 * @param  {Object} actionData - The data that was passed along with the action when evoked.
	 * @param  {Object} stateDiff - A diff of the state before execution of the action and after.
	 * @return {ActionEvent}
	 */
	constructor(action, actionData, stateDiff) {
		super();

		/**
		 * The name/key of the action that was evoked.
		 * @type {String}
		 */
		this.action = action;

		/**
		 * The data that was passed along with the action when evoked.
		 * @type {Object}
		 */
		this.actionData = actionData;

		/**
		 * A diff of the state before execution of the action and after.
		 * @type {Object}
		 */
		this.stateDiff = stateDiff;
	}
}

const a = new ActionEvent('eventname', { data: 0 }, { diff: 0 });
console.log(ActionEvent.fromJSON(ActionEvent, a.json()));
