const config = require("@config");
const state = require("@state");
const log = require("@helpers/log").logger("HomeKit", 'greenBright');

const { HapClient } = require('@oznu/hap-client');


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


module.exports = async function homekit() {
	if (!config.homebridge.pin) {
		log(
			'Won\'t be able to connect to Homebridge, as the secret pin is not defined in config file.'
		);
		state.callAction('HOMEKIT:SET-INITIALIZED', { initialized: false });
		return;
	}

	const debugLog = config.debug ? log : () => {};

	const hap = new HapClient({
		pin: config.homebridge.pin,
		logger: {
			log: debugLog,
			info: debugLog,
			error: log,
			warning: log,
			verbose: debugLog
		},
		config: {
			debug: true
		},
	});

	// TODO: Error detection for homebridge connection or something. I do
	// think that HapClient does error logging on its own but ¯\_(ツ)_/¯
	state.callAction('HOMEKIT:SET-INITIALIZED', { initialized: true });

	let monitor = null;
	
	hap.on('instance-discovered', async () => {
		log('Discovered new HAP instance');
		const servicesList = await hap.getAllServices();
	
		let servicesData = {};
		for (const service of servicesList) {
			// servicesActions[service.uniqueId] = {
			// 	getCharacteristic: service.getCharacteristic
			// };

			servicesData[service.uniqueId] = simplifyService(service);
		}

		state.callAction(
			'HOMEKIT:SET-SERVICES', 
			{ 
				services: servicesData,
				reset: true
			}
		);

		if (monitor) {
			monitor.finish();
			monitor = null;
		}

		// Setup monitoring of characteristics to detect changes
		monitor = await hap.monitorCharacteristics();
		const updateHandler = (data) => {
			log('Received characteristics update', data);

			let servicesData = {};
			for (const service of data) {
				servicesData[service.uniqueId] = simplifyService(service);
			}
			
			state.callAction(
				'HOMEKIT:SET-SERVICES', 
				{ 
					services: servicesData
				}
			);
		};
		monitor.on('service-update', updateHandler);
	});

	state.subscribe('action:HOMEKIT:MODIFY-CHARACTERISTICS', async (context) => {
		const { uniqueId, changes = {} } = context.actionData;

		log(`Modifying characteristics in service ${uniqueId} with changes ${JSON.stringify(changes, null, 2)}`);

		const services = await hap.getAllServices();
		const service = services.find(service => service.uniqueId === uniqueId);
		if (!service) {
			log(`Could not find service with id: ${uniqueId}`);
			return;
		}

		for (const characteristicName in changes) {
			const newValue = changes[characteristicName];

			const characteristic = service.getCharacteristic(characteristicName);

			if (!characteristic || !characteristic.setValue) {
				log(`Could not find characteristic with name: ${characteristicName}`);
				continue;
			}

			characteristic.setValue(newValue);
		}
	});
};
