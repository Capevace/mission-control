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
const basePath = require('os').homedir() + '/.mission-control';

const config = require('rc')('mission-control', {
	basePath,
	debug: false,
	sso: {
		url: 'http://localhost:3001',
		issuer: 'mission-control-sso',
		audience: 'mission-control'
	},
	http: {
		url: 'http://localhost',
		port: 3000
	},
	dashboard: {
		path: path.resolve(
			__dirname,
			'../../../dashboard/dist/development'
		), // static ui path
	},
	secrets: {
		session: 'secret',
		jwt: 'secret',
		iftttWebhook: 'dq0U6fRhl-t35dc_HnDem5',
		spotify: '2192e52bff6740cb8dbce0011305bb20'
	},
	spotify: {
		path: path.resolve(__dirname, '../../../spotify-player/dist'), // ui path
		clientId: 'f1421bd3dada404da546902b6849f2d7'
	},
	databasePath: basePath + '/database.json',
	storagePath: basePath + '/storage',

	// Move out of config
	devices: {
		outlets: {
			'tv-leds': { name: 'TV LEDs' },
			'bed-leds': { name: 'Bed LEDs' }
		}
	}
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
;port=

;[sso]
;url=

;[secrets]
;session=
;jwt=
;iftttWebhook=
;spotify=
`
	);
}

module.exports = config;