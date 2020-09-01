const { promisify } = require('util');
const publicIp = require('public-ip');
const childProcess = require('child_process');
const log = require('@helpers/log').logger('SSO', 'magenta');
const exec = promisify(childProcess.spawn);

// Spawn a mission-control-sso process
module.exports = function spawnSSOProcess(url, port) {
	log('Spawning SSO process');

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
		log(str.substring(0, str.length - 2));
	});

	proc.stderr.on('data', (data) => {
	  log('Error', data.toString());
	});

	proc.on('exit', function (code, signal) {
		log('Process exited with ' +
		`code ${code} and signal ${signal}`);
	});

	return proc;
}