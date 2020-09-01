const pkg = require('../../package.json');
const { program } = require('commander');
program
	.version(pkg.version)
	.option('-u, --url <url>', 'the url mission control is reachable at')
	.option('-p, --port <port>', 'the port to use for mission control')
	.option('-n, --no-sso', 'disable internal auth server process (to use own)')
	.option('--auth-url <url>', 'the url to use for the single-sign-on server')
	.option('--auth-port <port>', 'the port to use for the single-sign-on server');

program.parse(process.argv);

module.exports = program;