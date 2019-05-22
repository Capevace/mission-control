module.exports.call = function SET_NOTIFICATIONS(state, { notifications }) {
	return {
		...state,
		notifications
	};
};

module.exports.validate = function validate(data) {
	if ('notifications' in data && Array.isArray(data.notifications))
		return data;

	return false;
};
