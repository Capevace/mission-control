module.exports.call = function(state, data) {
	return {
		...state,
		systemInfo: data
	};
};

module.exports.validate = function(data) {
	if (typeof data === 'object') return data;

	return false;
};
