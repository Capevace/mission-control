module.exports = class MissionControlEvent {
	constructor(data = {}) {
		Object.assign(this, data);
	}

	/**
	 * Retrieve the state for the event.
	 * @return {Object}
	 */
	state() {}

	/**
	 * Convert this class into JSON data.
	 * @return {String}
	 */
	json() {
		return JSON.stringify(this);
	}

	/**
	 * Convert this class into a pure object.
	 * @return {Object}
	 */
	object() {
		return JSON.parse(this.json());
	}

	/**
	 * @param {Object} jsonData - The data to unserialize from.
	 * @return {Boolean} If this function returns true, the jsonData will automagically be assigned to the class instance. Override the method and explicitly return false here to turn that off.
	 */
	onUnserialize(jsonData) {
		return true;
	}

	/**
	 * @param  {String} json - The JSON data to unserialize.
	 * @return {Class} The class that was unserialized from json.
	 */
	static fromJSON(eventClassType, json) {
		const data = JSON.parse(json);
		const eventClass = new eventClassType();

		if (eventClass.onUnserialize(data)) {
			Object.assign(eventClass, data);
		}

		return eventClass;
	}
};
