module.exports.call = function(state, { scene, active }) {
	return {
		...state,
		scenes: {
			...state.scenes,
			[scene]: {
				...state.scenes[scene],
				active
			}
		}
	};
};

module.exports.validate = function(data) {
	if ('scene' in data) return data;

	return false;
};
