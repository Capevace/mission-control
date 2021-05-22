const { HapClient } = require('@oznu/hap-client');

/**
 * Homebridge Service
 * @typedef {HomebridgeDevice}
 * @property {string} uniqueId
 * @property {number} iid
 * @property {string} name
 * @property {string} type
 * @property {Array.<object>} characteristics
 * @property {Array.<object>} values
 */

/**
 * Connection States
 * @enum {string}
 */
const ConnectionStatus = {
	connected: 'connected',
	disconnected: 'disconnected',
	connecting: 'connecting'
};

module.exports = function homekitInit(APP) {
	const { state, logger, config, http } = APP;

	const service = sync.createService('homebridge', {
		status: ConnectionStatus.disconnected,

		/**
		 * @type {Array<HomebridgeDevice>}
		 */
		services: []
	});

	if (!config.homebridge.pin) {
		logger.warn(
			'Won\'t be able to connect to Homebridge, as the secret pin is not defined in config file.'
		);

		return;
	}

	service.setState({
		status: ConnectionStatus.connecting
	});

	http.addComponentFile('homekitSwitches', __dirname + '/component.html');

	const homebridge = new HapClient({
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
		}
	});

	let monitor = null;

	homebridge.on('instance-discovered', async () => {
		logger.debug('discovered homebridge instance');

		/**
		 * @type {Array.<HomebridgeDevice>}
		 */
		const devices = await homebridge.getAllServices();

		updateHomebridgeDevices(devices);

		if (monitor) {
			monitor.finish();
			monitor = null;
		}

		// Setup monitoring of characteristics to detect changes
		monitor = await homebridge.monitorCharacteristics();
		monitor.on('service-update', devices => {
			logger.debug('received homebridge device update');
			
			updateHomebridgeDevices(devices);
		});
	});

	service.action('interact')
		.requirePermission('update', 'homebridge', 'any')
		.validate(Joi => Joi.object({
			uniqueId: Joi.string()
				.trim()
				.required(),
			changes: Joi.object()
				.required()
		}))
		.handler((data, { UserError }) => {
			const { uniqueId, changes = {} } = data;

			logger.debug(`interact device: ${uniqueId} changes:`, changes);

			const devices = await homebridge.getAllServices();
			const device = devices.find(device => device.uniqueId === uniqueId);

			if (!device) {
				throw new UserError(`Homebridge device ${uniqueId} doesn't exist`, 404);
			}

			for (const characteristicName in changes) {
				const newValue = changes[characteristicName];

				const characteristic = device.getCharacteristic(characteristicName);

				if (!characteristic || !characteristic.setValue) {
					logger.debug(`device: ${uniqueId}, doesn't have characteristic ${characteristicName}`);
					continue;
				}

				characteristic.setValue(newValue);
			}
		});

	/**
	 * Set devices and update status to connected
	 * @param  {Array.<HomebridgeDevice>} devices 
	 */
	function updateHomebridgeDevices(devices) {
		let devices = {};
		for (const device of devices) {
			devices[device.uniqueId] = simplifyDevice(device);
		}

		service.setState({
			devices,
			status: ConnectionStatus.connected
		});
	}

	return {
		author: 'Lukas Mateffy (@capevace)',
		version: '0.0.1',
		description: 'Homebridge connection'
	};
};

function simplifyDevice(inputService) {
	return {
		uniqueId: inputService.uniqueId,
		iid: inputService.iid,
		name: inputService.serviceName,
		type: inputService.type,
		characteristics: inputService.serviceCharacteristics,
		values: inputService.values
	};
}