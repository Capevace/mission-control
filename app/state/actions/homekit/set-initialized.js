module.exports.call = function SET_INIYIALIZED(state, { initialized = false }) {
	return {
		...state,
		homekit: {
			initialized: !!initialized
		}
	};
};

module.exports.validate = function validate(state) {
	return state;
};
