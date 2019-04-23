const state = require('@state');

module.exports = function state(app) {
	/*
	 * This route lets you get the state from the state machine via URL parameters.
	 * Basically we take each parameter and go through the state object step by step.
	 * So getting the state like: state.lamps.livingRoom.isOn would be
	 * /state/lamps/livingRoom/isOn
	 * Also works using array indicies e.g. /array/1.
	 */
	app.get(
		'/state/:param1?/:param2?/:param3?/:param4?/:param5?/:param6?/:param7?/:param8?',
		(req, res) => {
			// Get the parameters and filter out the ones that arent set i.e. null
			const params = Object.values(req.params).filter(value => !!value);
			const currentState = state.getState();

			// Go through the list of parameters and find the object in the state
			const value = params.reduce((currentObject, param) => {
				if (
					currentObject === null ||
					typeof currentObject !== 'object' ||
					!(param in currentObject)
				)
					return null;

				return currentObject[param];
			}, currentState);

			res.json(value);
		}
	);

	/*
	 * This route enables calling an action by http request.
	 * You can pass data by using the URL query.
	 * So data like { isOn: true } would be /?isOn=true
	 * TODO: HTTP authentication
	 */
	app.get('/action/:action', (req, res) => {
		res.json(state.callAction(req.params.action, req.query));
	});
};
