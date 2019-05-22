module.exports.call = function DELETE_NOTIFICATION(state, { id }) {
	const newNotifications = state.notifications.filter(
		notification => notification.id !== id
	);

	return {
		...state,
		notifications: newNotifications
	};
};

module.exports.validate = function validate(data) {
	if ('id' in data) return data;

	return false;
};
