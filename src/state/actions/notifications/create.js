const uuid = require('uuid/v4');

module.exports.call = function CREATE_NOTIFICATION(state, { title, message }) {
	return {
		...state,
		notifications: [
			...state.notifications,
			{ title, message, unread: true, id: uuid(), date: new Date() }
		]
	};
};

module.exports.validate = function validate(data) {
	if ('title' in data) return data;

	return false;
};
