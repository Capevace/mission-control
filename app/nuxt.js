const path = require('path');
const { Nuxt, Builder } = require('nuxt');
const { getDefaultNuxtConfig } = require('@nuxt/config');
const { BundleBuilder } = require('@nuxt/webpack');

module.exports = async function initNuxt() {
	const nuxt = new Nuxt({
		...getDefaultNuxtConfig(),

		dev: true,
		// srcDir: 'src',
		rootDir: path.resolve(__dirname, '../'),
		telemetry: false,
		dir: {
			app: 'ass',
		},

		// css: ['~/assets/css/tailwind.css'],

		components: true,
		// server: {
		// 	socket: '/dev/null',
		// },
		modulesDir: [
			'/Users/mat/Projects/mission-control/node_modules/nuxt/bin/node_modules',
			'/Users/mat/Projects/mission-control/node_modules/nuxt/node_modules',
			'/Users/mat/Projects/mission-control/node_modules',
		],

		buildModules: [
			'@nuxt/typescript-build',
			// https://go.nuxtjs.dev/tailwindcss
			'@nuxtjs/tailwindcss',
		],

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
		// router: {
		// 	extendRoutes(routes) {
		// 		console.log(routes);
		// 		return [
		// 			// {
		// 			// 	name: 'dashboard',
		// 			// 	path: '/',
		// 			// 	component: path.resolve(
		// 			// 		__dirname,
		// 			// 		'/Users/mat/Projects/mission-control/app/views/Dashboard.vue'
		// 			// 	),
		// 			// },
		// 			...routes,
		// 		];
		// 	},
		// },
	});

	await nuxt.ready();

	// nuxt.moduleContainer.extendRoutes((routes) => [
	// 	// {
	// 	// 	name: 'dashboard',
	// 	// 	path: '/',
	// 	// 	component: path.resolve(
	// 	// 		__dirname,
	// 	// 		'/Users/mat/Projects/mission-control/app/views/Dashboard.vue'
	// 	// 	),
	// 	// },
	// 	...routes,
	// ]);

	return {
		nuxt,
		builder: new Builder(nuxt, BundleBuilder),
	};
};
