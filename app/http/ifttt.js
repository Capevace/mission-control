const state = require('@state');

module.exports = function iftttRoutes(app) {
	app.post('/ifttt/webhook', () => {
		state.emitEvent('ifttt:callback', {});
	});
};
