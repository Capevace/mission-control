/*

Service: {
	uniqueId: string,
	iid: string,
	name: string,
	type: 'Switch',
	characteristics: [{}],
	values: []
}

*/

module.exports.call = function SET_SERVICES(state, { services = {}, reset = false }) {
	const value = reset ? services : { ...state.homekit.services, ...services };

	return {
		...state,
		homekit: {
			...state.homekit,
			services: value
		}
	};
};

module.exports.validate = function validate(data) {
	const allItemsComplete = Object.values(data.services)
		.filter(
			service => 
				service.uniqueId 
				&& service.iid 
				&& service.name 
				&& service.type 
				&& Array.isArray(service.characteristics) 
				&& Array.isArray(service.values)
		).length > 0;

	if (data.services && !allItemsComplete) {
		return data;
	}

	return false;
};
