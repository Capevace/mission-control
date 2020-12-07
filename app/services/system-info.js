const state = require('@state');
const si = require('systeminformation');
const publicIp = require('public-ip');
const pkg = require('../../package.json');

async function systemInformationInit() {
	const [system, cpu, osInfo] = await Promise.all([
		si.system(),
		si.cpu(),
		si.osInfo()
	]);

	const staticInfo = {
		system: {
			manufacturer: system.manufacturer,
			model: system.model
		},
		cpu: {
			manufacturer: cpu.manufacturer,
			brand: cpu.brand,
			cores: cpu.cores,
			speedMax: cpu.speedmax,
			mainTemperature: -1
		},
		os: {
			platform: osInfo.platform,
			distro: osInfo.distro,
			version: osInfo.release,
			name: osInfo.codename,
			architecture: osInfo.arch,
			hostname: osInfo.hostname
		},
		version: pkg.version
	};

	const refreshInfo = async () => {
		const [
			temp,
			memory,
			networkInterfaces,
			currentLoad,
			ip
		] = await Promise.all([
			si.cpuTemperature(),
			si.mem(),
			si.networkInterfaces(),
			si.currentLoad(),
			publicIp.v4({ https: true }).catch(() => null)
		]);

		const network = networkInterfaces.reduce((mainNetwork, iface) => {
			if (mainNetwork !== null) return mainNetwork;

			if (iface.ip4 !== '' && iface.ip4 !== '127.0.0.1') return iface;

			return mainNetwork;
		}, null);

		const data = {
			...staticInfo,
			cpu: {
				...staticInfo.cpu,
				mainTemperature: temp.main,
				currentLoad: currentLoad.currentload,
				cores: currentLoad.cpus.map(cpu => ({
					load: cpu.load
				}))
			},
			memory: {
				total: memory.total,
				free: memory.free,
				used: memory.used
			},
			network: {
				internalIPv4: network ? network.ip4 : '-',
				publicIPv4: ip || '-',
				mac: network ? network.mac : '-',
				speed: network ? network.speed : '-'
			}
		};

		state.callAction('SYSTEM-INFO:UPDATE', data);
	};
	refreshInfo();
	setInterval(refreshInfo, 20000);
};

module.exports = {
	actions: {
		/**
		 * Update the system info statistics table.
		 *
		 * @constant SYSTEM-INFO:UPDATE
		 */
		'SYSTEM-INFO:UPDATE': {
			update(state, data) {
				return {
					...state,
					systemInfo: data
				};
			},
			validate(data) {
				if (typeof data === 'object') return data;

				return false;
			}
		}
	},
	init: systemInformationInit
};