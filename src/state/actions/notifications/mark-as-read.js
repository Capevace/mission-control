module.exports.call = function(state, { id }) {
	const newNotifications = state.notifications.map(notification =>
		notification.id === id
			? { ...notification, unread: false }
			: notification
	);

	return {
		...state,
		notifications: newNotifications
	};
};

module.exports.validate = function(data) {
	if ('id' in data) return data;

	return false;
};
