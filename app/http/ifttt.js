const config = require('@config');
const state = require('@state');
const log = require('@helpers/log').logger('IFTTT');

module.exports = function iftttRoutes(app) {
	app.post('/ifttt/webhook', (req, res) => {
		state.emitEvent('ifttt:callback', {});
	});
};
