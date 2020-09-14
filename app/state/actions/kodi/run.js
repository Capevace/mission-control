// prettier-ignore
module.exports.call = function(state, data) {
	return state;
};

module.exports.validate = function(data = {}) {
	if ('kodiId' in data && 'command' in data) return data;
	
	return false;
};
