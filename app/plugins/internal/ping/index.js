const restart = require('@helpers/restart');

module.exports = function ping({ dashboard, sync }) {
	const service = sync
		.createService('ping', {
			items: {
				webssh: {
					name: 'WebSSH2',
					tag: 'SSH client in browser',
					port: ':3003',
					url: 'http://datenregal.local:3003',
					permission: 'admin.webssh',
					order: 1,
				},
				'bridge-server': {
					name: 'Bridge Server',
					tag: '433 MHz and BLE controller',
					port: ':4001',
					url: 'http://datenregal.local:4001',
					permission: 'admin.bridge-server',
					order: 2,
				},
				frpc: {
					name: 'FRPC',
					tag: 'Connect Pi to cloud via Hetzner',
					port: ':3003',
					url: '#',
					permission: 'admin.frpc',
					order: 3,
				},
				'youtube-downloader': {
					name: 'Youtube Downloader',
					tag: 'SSH client in browser',
					port: ':3004',
					url: 'http://datenregal.local:3004',
					permission: 'admin.youtube-downloader',
					order: 4,
				},
			},
		})
		.addFilter((state, { user, permissions }) => {
			return permissions.can(user.role).read('lifecycle', 'any').granted
				? state
				: { restarting: false };
		});

	service
		.action('restart')
		.requirePermission('update', 'lifecycle', 'any')
		.handler(async (data, { state }) => {
			setTimeout(async () => {
				await restart();
			}, 2000);

			state.restarting = true;

			return {
				restartIn: 2000,
				restarting: true,
			};
		});

	dashboard.component('ping').custom(__dirname + '/component.html');

	return {
		internal: true,
		version: '0.0.1',
		description: 'Mission Control lifecycle controls',
	};
};
