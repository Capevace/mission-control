module.exports.call = function(state, data) {
	return {
		...state,
		layout: data.layout
	};
};

module.exports.validate = function(data) {
	if (Array.isArray(data.layout)) return data;

	return false;
};
