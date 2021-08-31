const path = require('path');
const { Nuxt, Builder } = require('nuxt');

module.exports = function initNuxt(sync) {
	const nuxt = new Nuxt({
		dev: true,
		rootDir: path.resolve(__dirname, '../../nuxt/mission-control'),
		buildDir: path.resolve(__dirname, '../../nuxt/mission-control/.nuxt'),
		telemetry: false,
		server: {
			socket: '/dev/null',
		},
		// modulesDir: [
		// 	path.resolve(__dirname, '../../nuxt/mission-control/node_modules'),
		// ],

		buildModules: [
			// https://go.nuxtjs.dev/tailwindcss
			'@nuxtjs/tailwindcss',
		],

		build: {
			postcss: {
				plugins: {
					tailwindcss: {},
				},
			},
		},

		head: {
			title: 'mission-control',
			htmlAttrs: {
				lang: 'en',
			},
			meta: [
				{ charset: 'utf-8' },
				{
					name: 'viewport',
					content: 'width=device-width, initial-scale=1',
				},
				{ hid: 'description', name: 'description', content: '' },
				{ name: 'format-detection', content: 'telephone=no' },
			],
			link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
		},
		router: {
			extendRoutes(routes) {
				console.log(routes);
				return [
					{
						name: 'dashboard',
						path: '/',
						component: path.resolve(
							__dirname,
							'/Users/mat/Projects/mission-control/app/views/Dashboard.vue'
						),
					},
					...routes,
				];
			},
		},
	});

	return {
		nuxt,
		builder: new Builder(nuxt),
	};
};
