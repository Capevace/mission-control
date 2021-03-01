const { HapClient } = require('@oznu/hap-client');

module.exports = function homekitInit(APP) {
	const { state, logger, config } = APP;

	/**
	 * @ACTION
	 * @TODO Turn this into an EVENT

	 * This is supposed to be a no op action because 
	 * we still have to register it with the state system.
	 */
	state.registerAction(
		'HOMEKIT:MODIFY-CHARACTERISTICS', 
		(state) => {
			return {
				...state
			};
		},
		(data) => data
	);

	/**
	 * @ACTION
	 * Set homebridge config initialization state to indicate wether the pin is configured.
	 *
	 * @constant HOMEKIT:SET-INITIALIZED
	 * @property {Boolean} initialized 
	 * @example
	 * state.run('HOMEKIT:SET-INITIALIZED', { initialized: false })
	 */
	state.registerAction(
		'HOMEKIT:SET-INITIALIZED', 
		(state, { initialized = false }) => {
			return {
				...state,
				homekit: {
					initialized: !!initialized
				}
			};
		},
		(data) => data
	);

	/**
	 * @ACTION
	 * Set the devices homebridge sees
	 *
	 * @constant HOMEKIT:SET-SERVICES
	 * @property {Object} service The video object to push onto the queue.
	 * @property {string} service.uniqueId A unique ID for the service.
	 * @property {number} service.iid A unique ID for the service (used for identification internally).
	 * @property {string} service.name Name of the service
	 * @property {string} service.type Type of the service
	 * @property {Array} service.characteristics Array of characteristics
	 * @property {Array} service.values Array of values for the characteristics
	 * @example
	 * state.run('HOMEKIT:SET-SERVICES', { services: { 'serviceID': { ...service }}})
	 */
	state.registerAction(
		'HOMEKIT:SET-SERVICES', 
		(state, { services = {}, reset = false }) => {
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

			const value = reset ? services : { ...state.homekit.services, ...services };

			return {
				...state,
				homekit: {
					...state.homekit,
					services: value
				}
			};
		},
		(data) => {
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
		}
	);

	if (!config.homebridge.pin) {
		logger.warn(
			'Won\'t be able to connect to Homebridge, as the secret pin is not defined in config file.'
		);
		state.run('HOMEKIT:SET-INITIALIZED', { initialized: false });
		return;
	}

	const hap = new HapClient({
		pin: config.homebridge.pin,
		logger: {
			log: logger.debug,
			info: logger.debug,
			error: logger.error,
			warning: logger.warn,
			verbose: logger.debug
		},
		config: {
			debug: true
		},
	});

	// TODO: Error detection for homebridge connection or something. I do
	// think that HapClient does error logging on its own but ¯\_(ツ)_/¯
	state.run('HOMEKIT:SET-INITIALIZED', { initialized: true });

	let monitor = null;

	hap.on('instance-discovered', async () => {
		logger.debug('Discovered new HAP instance');
		const servicesList = await hap.getAllServices();

		let servicesData = {};
		for (const service of servicesList) {
			// servicesActions[service.uniqueId] = {
			// 	getCharacteristic: service.getCharacteristic
			// };

			servicesData[service.uniqueId] = simplifyService(service);
		}

		state.run(
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
			logger.debug('Received characteristics update', data);

			let servicesData = {};
			for (const service of data) {
				servicesData[service.uniqueId] = simplifyService(service);
			}

			state.run(
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

		logger.debug(`Modifying characteristics in service ${uniqueId} with changes ${JSON.stringify(changes, null, 2)}`);

		const services = await hap.getAllServices();
		const service = services.find(service => service.uniqueId === uniqueId);
		if (!service) {
			logger.error(`Could not find service with id: ${uniqueId}`);
			return;
		}

		for (const characteristicName in changes) {
			const newValue = changes[characteristicName];

			const characteristic = service.getCharacteristic(characteristicName);

			if (!characteristic || !characteristic.setValue) {
				logger.error(`Could not find characteristic with name: ${characteristicName}`);
				continue;
			}

			characteristic.setValue(newValue);
		}
	});

	return {
		author: 'Lukas Mateffy (@capevace)',
		version: '0.0.1',
		description: 'HomeKit switch bridge'
	};
};

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