// prettier-ignore
module.exports.call = function(state, { accessToken, expiresAt, refreshToken }) {
	return {
		...state,
		spotify: {
			...state.spotify,
			accessToken,
			expiresAt,
			refreshToken
		}
	};
};

module.exports.validate = function(data) {
	if ('accessToken' in data && 'expiresAt' in data && 'refreshToken' in data)
		return data;

	return false;
};
