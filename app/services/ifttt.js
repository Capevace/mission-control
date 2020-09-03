const config = require('@config');
const state = require('@state');
const log = require('@helpers/log').logger('IFTTT', 'greenBright');

const superagent = require('superagent');

function getWebhookUrl(event) {
	return `https://maker.ifttt.com/trigger/${event}/with/key/${
		config.secrets.iftttWebhook
	}`;
}

async function triggerWebhook(event, value1, value2, value3) {
	try {
		await superagent
			.post(getWebhookUrl(event))
			.type('json')
			.send({ value1, value2, value3 });

		log(`Successfully triggered webhook "${event}".`);
	} catch (e) {
		log(`Error occurred triggering webhook "${event}".`, e.body || e);
	}
}

module.exports = async function ifttt() {
	if (!config.ifttt.secret) {
		log(
			"Won't be able to trigger IFTTT webhooks, as webhook key is not defined in config file."
		);

		return;
	}

	state.subscribe('ifttt:webhook', () => {
		triggerWebhook();
	});
};
