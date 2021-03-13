/**
 * Logging Helpers
 * @module @helpers/log
 * @requires chalk, qrcode-terminal
 */

const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const onFinished = require('on-finished');
const cliProgress = require('cli-progress');

let logBuffer = [];
let progressBar = null;

const console_log = console.log.bind(console);

module.exports._log = function _log(...msgs) {
	if (progressBar)
		logBuffer.push(msgs);
	else
		console_log(...msgs); // eslint-disable-line
};

const LogLevel = {
	debug: 0,
	http: 1,
	info: 2,
	warn: 3,
	error: 4,
	fatal: 5,
	silent: 6
};
module.exports.LogLevel = LogLevel;


/**
 * Return a LogLevel from string.
 * @param {string} level 
 * @returns LogLevel | null
 */
module.exports.logLevelFromString = function logLevelFromString(level) {
	return LogLevel[level];
};

/**
 * Convert a LogLevel to string.
 * @param {LogLevel} logLevel 
 * @returns string | null
 */
module.exports.logLevelToString = function logLevelToString(logLevel) {
	let text = null;

	switch (logLevel) {
		case 0:
			text = chalk.green('DEBUG');
			break;
		case 1:
			text = chalk.magenta('HTTP');
			break;
		case 2:
			text = chalk.cyan('INFO');
			break;
		case 3:
			text = chalk.yellow('WARN');
			break;
		case 4:
			text = chalk.red('ERROR');
			break;
		case 5:
			text = chalk.red.bgBlack('FATAL');
			break;
		case 6:
			text = chalk.white.bgBlack('SILENT');
			break;
	}

	return text;
};

/**
 * Create a log function with a LogLevel label attached.
 * @param {LogLevel} levelOfLogger
 * @returns Function
 */
function createLogFunction(levelOfLogger) {
	const label = module.exports.logLevelToString(levelOfLogger);

	return function log(...msgs) {
		if (logLevel <= levelOfLogger)
			module.exports._log(/*formatISO(new Date()),*/ label, ...msgs);
	};
}

/**
 * The global log level.
 */
let logLevel = LogLevel.http;

/*
 * The respective log functions.
 */
const debug = createLogFunction(LogLevel.debug);
const http = createLogFunction(LogLevel.http);
const info = createLogFunction(LogLevel.info);
const warn = createLogFunction(LogLevel.warn);
const error = createLogFunction(LogLevel.error);
const fatal = createLogFunction(LogLevel.fatal);

module.exports.debug = debug;
module.exports.http = http;
module.exports.info = info;
module.exports.warn = warn;
module.exports.error = error;
module.exports.fatal = fatal;


/**
 * Create a logger with text label attached.
 * @param {string} label
 * @param {string} color
 */
module.exports.createLogger = function createLogger(label, color = 'reset') {
	if (!label)
		return {
			debug,
			http,
			info,
			warn,
			error,
			fatal
		};

	const colorFn = chalk[color];

	if (!colorFn)
		throw new Error(`Log color unsupported: ${color}`);

	label = colorFn(label);

	return {
		debug: (...msgs) => debug(label, ...msgs),
		http: (...msgs) => http(label, ...msgs),
		info: (...msgs) => info(label, ...msgs),
		warn: (...msgs) => warn(label, ...msgs),
		error: (...msgs) => error(label, ...msgs),
		fatal: (...msgs) => fatal(label, ...msgs)
	};
};

/**
 * Set the global log level.
 * @param {LogLevel} level 
 */
module.exports.setLogLevel = function setLogLevel(levelString = 'debug') {
	if (!levelString)
		return;

	// If we can parse a log level from the logLevel config, then a string was passed and we can
	// parse the log level value.
	logLevel = this.logLevelFromString(levelString) || 0;
};

/**
 * Ouput the styled ready message including a QR code that leads to the base url.
 *
 * @param  {String} url - The url to encode and log.
 * @param  {String} authUrl - The auth url to display.
 */
module.exports.logReadyMessage = function logReadyMessage(url, authUrl) {
	qrcode.generate(url, { small: true }, function (qrCode) {
		const message =
			`
${`.  . .-. .-. .-. .-. .-. . .   .-. .-. . . .-. .-. .-. .   
|\\/|  |  \`-. \`-.  |  | | |\\|   |   | | |\\|  |  |(  | | |   
'  ' '-' '-' '-' '-' '-' ' '   '-' '-' ' '  '  ' ' '-' '-' `}

Mission Control available at ${chalk.cyan(url)}

${qrCode}
`;

		module.exports._log(message); // eslint-disable-line no-console
	});
};

module.exports.logMiddleware = function logMiddleware(req, res, next) {
	let startTime = process.hrtime();

	onFinished(res, () => {
		const colorFn = res.statusCode >= 500 ? chalk.red // red
			: res.statusCode >= 400 ? chalk.yellow // yellow
				: res.statusCode >= 300 ? chalk.cyan // cyan
					: res.statusCode >= 200 ? chalk.green // green
						: chalk.reset;

		const now = process.hrtime();
		const ms = (now[0] - startTime[0]) * 1e3 +
			(now[1] - startTime[1]) * 1e-6;

		http(req.method, req.url, colorFn(res.statusCode), `${ms.toFixed(3)}ms`);
	});

	next();
};

module.exports.logConfig = function logConfig(config) {
	const spotifyCredentialsPresent = config.spotify.clientId && config.spotify.secret;
	
	module.exports._log(
		chalk`=== {bold Mission Control Config} ===
Log Level:		${config.logLevel}
DB Path:		{cyan ${config.databasePath}}
Dashboard Path: 	{cyan ${config.dashboard.path}}
Homebridge Pin:		${config.homebridge.pin || chalk.reset.gray('None')}
Spotify Creds:		${spotifyCredentialsPresent ? 'Provided' : 'Not provided'}
HTTP URL:		{cyan ${config.http.url}}
HTTP Port:		${config.http.port}
HTTP Domains:		${config.http.allowedDomains.map(domain => chalk`{cyan ${domain}}`).join(', ')}
\n`
	);
};

module.exports.progress = async function progress(callback) {
	progressBar = new cliProgress.SingleBar({
	    format: `|${chalk.cyan('{bar}')}| {percentage}% {label}`,
	    barCompleteChar: '\u2588',
	    barIncompleteChar: '\u2591',
	    hideCursor: true
	}, cliProgress.Presets.rect);

	progressBar.start(1, 0, {
	    label: ''
	});

	function cleanup() {
		if (progressBar)
			progressBar.stop();

		logBuffer.forEach(msgs => console_log(...msgs));
		logBuffer = [];

		progressBar = null;
	}

	try {
		await callback((label, percentage) => progressBar.update(percentage, { label }));
		cleanup();
	} catch (e) {
		cleanup();
		module.exports.error(e);
	}
};

console.log = console.info = debug;
console.warn = warn;
console.error = error;

process.on('uncaughtException', function (err) {
	error(chalk.red.bold('Uncaught Exception'), err);
});