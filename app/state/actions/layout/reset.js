module.exports.call = function (state) {
	return {
		...state,
		layout: []
	};
};

module.exports.validate = function () {
	return true;
};
