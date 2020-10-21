const childProcess = require('child_process');
const logger = require('@helpers/logger').createLogger('SSO', 'magenta');

// Spawn a mission-control-sso process
module.exports = function spawnSSOProcess(url, port) {
	logger.info('Spawning SSO process');

	let args = [];

	if (url) {
		args.push('--url');
		args.push(url);
	}

	if (port) {
		args.push('--port');
		args.push(port);
	}

	const proc = childProcess.spawn('single-sign-on', args);

	proc.stdout.on('data', (data) => {
		const str = data.toString();
		logger.debug(str.substring(0, str.length - 2));
	});

	proc.stderr.on('data', (data) => {
		logger.error('Error', data.toString());
	});

	proc.on('exit', function (code, signal) {
		logger.error(`SSO process quit unexpectedly with code ${code} and signal ${signal}`);
	});

	return proc;
};