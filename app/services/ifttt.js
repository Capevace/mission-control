const config = require('@config');
const state = require('@state');
const logger = require('@helpers/logger').createLogger('IFTTT', 'greenBright');

const superagent = require('superagent');

function getWebhookUrl(event) {
	return `https://maker.ifttt.com/trigger/${event}/with/key/${config.secrets.iftttWebhook}`;
}

async function triggerWebhook(event, value1, value2, value3) {
	try {
		await superagent
			.post(getWebhookUrl(event))
			.type('json')
			.send({ value1, value2, value3 });

		logger.debug(`Webhook triggered with event "${event}".`);
	} catch (e) {
		logger.error(`Error occurred in webhook with "${event}".`, e.body || e);
	}
}

module.exports = async function ifttt() {
	if (!config.ifttt.secret) {
		logger.warn(
			"Won't be able to trigger IFTTT webhooks, as webhook key is not defined in config file."
		);

		return;
	}

	state.subscribe('ifttt:webhook', () => {
		triggerWebhook();
	});
};
