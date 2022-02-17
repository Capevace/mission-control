const pkg = require('../../package.json');
const { program } = require('commander');
program
	.version(pkg.version)
	.option('-u, --url <url>', 'the url mission control is reachable at')
	.option('-p, --port <port>', 'the port to use for mission control')
	.option('-l, --log-level <level>', 'set the log level')
	.option('-d, --debug', 'enable debug mode')
	.option('-s, --silent', 'disable all output');

program.parse(process.argv);

module.exports = program.opts();