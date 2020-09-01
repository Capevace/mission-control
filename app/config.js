/**
 * Config Module
 *
 * This module exports the config object.
 * It generates some dynamic parts but should be customizable.
 *
 * @todo  Make it more dynamic by loading a json file.
 *
 * @module @config
 * @since 1.0.0
 * @requires rc
 */

const fs = require('fs');
const path = require('path');
const log = require('@helpers/log').logger('Config', 'cyan');
const argv = require('@helpers/argv');

const basePath = process.env.NODE_ENV === 'production'
	? '/etc/mission-control'
	: require('os').homedir() + '/.mission-control';

let config = require('rc')('mission-control', {
	basePath,
	debug: false,
	auth: {
		url: 'http://localhost:3001',
		issuer: 'mission-control-sso',
		audience: 'mission-control',
		secret: 'applepie',
		port: 3001
	},
	http: {
		url: 'http://localhost:3000',
		port: process.env.PORT || 3000
	},
	dashboard: {
		path: path.resolve(
			__dirname,
			'../../resources/dashboard-ui'
		), // static ui path
	},
	homebridge: {
		pin: null,
	},
	spotify: {
		path: path.resolve(__dirname, '../../../spotify-player/dist'), // ui path
		clientId: 'f1421bd3dada404da546902b6849f2d7',
		secret: '2192e52bff6740cb8dbce0011305bb20'
	},
	ifttt: {
		token: 'dq0U6fRhl-t35dc_HnDem5'
	},
	databasePath: basePath + '/database.json',
	storagePath: basePath + '/storage',
});

if (!fs.existsSync(config.basePath)) {
	log('Base path not found. Creating base directory ' + config.basePath);

	fs.mkdirSync(config.basePath, { recursive: true });
}

if (!fs.existsSync(config.basePath + '/config')) {
	log('Config file not found. Creating...');

	fs.writeFileSync(config.basePath + '/config', 
`; Mission Control Config File

; Enable debug mode here
;debug=true

;[http]
;url=
;port=3000

[auth]
;secret=applepie
;url=

;[homebridge]
;pin=

;[spotify]
;clientId=
;secret=

;[ifttt]
;token=

`
	);
}

if (argv.url) {
	config.http.url = argv.url;
}

if (argv.port) {
	config.http.port = argv.port;
}

if (argv.authUrl) {
	config.auth.url = argv.authUrl;
}

if (argv.authPort) {
	config.auth.port = argv.authPort;
}

module.exports = config;