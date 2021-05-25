const si = require('systeminformation');
const publicIp = require('public-ip');
const pkg = require('@root/package.json');

async function composeStaticStats(config) {
	const [system, cpu, osInfo] = await Promise.all([
		si.system(),
		si.cpu(),
		si.osInfo()
	]);

	return {
		deviceName: config.name,
		version: config.version,
		system: {
			manufacturer: system.manufacturer,
			model: system.model
		},
		cpu: {
			manufacturer: cpu.manufacturer,
			brand: cpu.brand,
			cores: cpu.cores,
			speedMax: cpu.speedMax,
			mainTemperature: -1
		},
		os: {
			platform: osInfo.platform,
			distro: osInfo.distro,
			version: osInfo.release,
			name: osInfo.codename,
			architecture: osInfo.arch,
			hostname: osInfo.hostname
		}
	};
}

async function combineWithDynamicStats(staticInfo) {
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

	return {
		...staticInfo,
		cpu: {
			...staticInfo.cpu,
			mainTemperature: temp.main || -1,
			currentLoad: currentLoad.currentLoad,
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
}


module.exports = async function telemetry(APP) {
	const { config, sync, state, database, http } = APP;

	const service = sync.createService('telemetry', {
		stats: null
	});

	const staticInfo = await composeStaticStats(config);

	async function refreshStats() {
		const stats = await combineWithDynamicStats(staticInfo);

		service.setState({
			stats
		});
	}

	refreshStats();
	setInterval(refreshStats, 20000);

	http.addComponentFile('basic-header', __dirname + '/header.html');

	return {
		version: '0.0.1',
		description: 'System Information plugin'
	};
};