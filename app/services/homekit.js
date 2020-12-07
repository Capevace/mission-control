const config = require('@config');
const state = require('@state');
const logger = require('@helpers/logger').createLogger('HomeKit', 'greenBright');

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

async function homekitInit() {
	if (!config.homebridge.pin) {
		logger.warn(
			'Won\'t be able to connect to Homebridge, as the secret pin is not defined in config file.'
		);
		state.callAction('HOMEKIT:SET-INITIALIZED', { initialized: false });
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
	state.callAction('HOMEKIT:SET-INITIALIZED', { initialized: true });

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
			logger.debug('Received characteristics update', data);

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
};

module.exports = {
	events: {
		/**
		 * Set the devices homebridge sees
		 *
		 * @constant HOMEKIT:MODIFY-CHARACTERISTICS
		 * @property {number} uniqueId The service ID
		 * @property {object} changes The changes to be applied
		 * @example
		 * state.callAction('HOMEKIT:MODIFY-CHARACTERISTICS', { uniqueId: 0, changes: { 'On': false }})
		 */
		'HOMEKIT:MODIFY-CHARACTERISTICS': 1
	},
	actions: {
		/**
		 * Update COVID data
		 *
		 * @constant COVID:UPDATE
		 * @property {object} changes The data to be set
		 * @example
		 * state.callAction('COVID:UPDATE', { cities: { 'city-id': { } } })
		 */
		'HOMEKIT:MODIFY-CHARACTERISTICS': {
			update(state, data) {
				return {
					...state,
					covid: data
				};
			},
			validate(data) {
				if (typeof data === 'object') return data;

				return false;
			}
		},

		/**
		 * Set homebridge config initialization state to indicate wether the pin is configured.
		 *
		 * @constant HOMEKIT:SET-INITIALIZED
		 * @property {Boolean} initialized 
		 * @example
		 * state.callAction('HOMEKIT:SET-INITIALIZED', { initialized: false })
		 */
		'HOMEKIT:SET-INITIALIZED': {
			update(state, { initialized = false }) {
				return {
					...state,
					homekit: {
						initialized: !!initialized
					}
				};
			},
			validate(data) {
				return data;
			}
		},

		/**
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
		 * state.callAction('HOMEKIT:SET-SERVICES', { services: { 'serviceID': { ...service }}})
		 */
		'HOMEKIT:SET-SERVICES': {
			update(state, { services = {}, reset = false }) {
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
			validate(data) {
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
		},
	},
	init: homekitInit
};