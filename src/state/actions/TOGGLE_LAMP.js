module.exports.call = function TOGGLE_LAMP(state, { isOn }) {
	return {
		...state,
		lamp: isOn
	};
};

module.exports.validate = function validate(data) {
	// Make sure isOn is boolean
	if ('isOn' in data) return { isOn: Boolean(data.isOn) };

	return false;
};
