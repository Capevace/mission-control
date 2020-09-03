const config = require('@config');
const state = require('@state');
const log = require('@helpers/log').logger('Plugins');

const fs = require('fs');
const path = require('path');
const readFileAsync = require('util').promisify(fs.readFile);


function simplifyService(inputService) {
	return {
		uniqueId: inputService.uniqueId,
		iid: inputService.iid,
		name: inputService.serviceName,
		type: inputService.type,
		characteristics: inputService.serviceCharacteristics,
		values: inputService.values
	};
}


async function initializePlugins() {
	const pluginsDir = '';
	const 
}

module.exports = async function plugins() {
	const plugins

	// state.subscribe('action:HOMEKIT:MODIFY-CHARACTERISTICS', async (context) => {
	// 	const { uniqueId, changes = {} } = context.actionData;

	// 	log(`Modifying characteristics in service ${uniqueId} with changes ${JSON.stringify(changes, null, 2)}`);

	// 	const services = await hap.getAllServices();
	// 	const service = services.find(service => service.uniqueId === uniqueId);
	// 	if (!service) {
	// 		log(`Could not find service with id: ${uniqueId}`);
	// 		return;
	// 	}

	// 	for (const characteristicName in changes) {
	// 		const newValue = changes[characteristicName];

	// 		const characteristic = service.getCharacteristic(characteristicName);

	// 		if (!characteristic || !characteristic.setValue) {
	// 			log(`Could not find characteristic with name: ${characteristicName}`);
	// 			continue;
	// 		}

	// 		characteristic.setValue(newValue);
	// 	}
	// });
};
