module.exports.call = function(state, data) {
	return {
		...state,
		bahn: data
	};
};

module.exports.validate = function(data) {
	if (typeof data === 'object') return data;

	return false;
};
