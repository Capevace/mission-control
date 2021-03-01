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
const internalIp = require('internal-ip');
const logging = require('./helpers/logger');
const logger = logging.createLogger('Config', 'cyan');
const argv = require('./helpers/argv');
const pkg = require('../package.json');

const basePath = process.env.NODE_ENV === 'production'
	? '/etc/mission-control'
	: require('os').homedir() + '/.mission-control';

let config = require('rc')('mission-control', {
	version: pkg.version,
	basePath,
	logLevel: 'http',
	debug: false,
	auth: {
		url: '/sso',
		issuer: 'mission-control-sso',
		audience: 'mission-control',
		secret: 'applepie',
		port: 3001,
		proxy: true
	},
	http: {
		url: `http://${internalIp.v4.sync()}:3000`,
		port: process.env.PORT || 3000,
		allowedDomains: []
	},
	dashboard: {
		path: path.resolve(
			__dirname,
			'../resources/dashboard-ui'
		), // static ui path
	},
	homebridge: {
		pin: null,
	},
	spotify: {
		path: path.resolve(
			__dirname,
			'../resources/spotify-ui'
		), // ui path
		clientId: '', // 'f1421bd3dada404da546902b6849f2d7',
		secret: '' // '2192e52bff6740cb8dbce0011305bb20'
	},
	ifttt: {
		token: 'dq0U6fRhl-t35dc_HnDem5'
	},
	databasePath: basePath + '/database.json',
	storagePath: basePath + '/storage',
});

if (!fs.existsSync(config.basePath)) {
	logger.warn('Base path not found. Creating base directory ' + config.basePath);

	fs.mkdirSync(config.basePath, { recursive: true });
}

if (!fs.existsSync(config.basePath + '/config')) {
	logger.warn('Config file not found. Creating...');

	fs.writeFileSync(config.basePath + '/config',
		`; Mission Control Config File

; Enable debug mode here
;debug=true

;[http]
;url=/sso
;port=3000
;allowedDomains[]=url1.com
;allowedDomains[]=url2.com
; Allowed Urls will also contain http.url

[auth]
;secret=applepie
;url=/sso
;port=3001
;proxy=false

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

if (argv.logLevel) {
	config.logLevel = argv.logLevel;
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

if (argv.debug) {
	config.debug = argv.debug;
}

if (argv.proxy) {
	config.auth.proxy = argv.proxy;
}

if (config.debug) {
	config.logLevel = logging.LogLevel.debug;
}

// Set debug mode
logging.setLogLevel(config.logLevel);

if (config.http.allowedDomains.length === 0) {
	const url = new URL(config.http.url);

	config.http.allowedDomains.push(
		`${url.hostname}${url.port ? ':' + url.port : ''}`
	);
}

module.exports = config;