const chalk = require('chalk');

function welcomeLog(config) {

	const httpString =
		`HTTP URL:	${chalk.cyan(config.http.url)}
HTTP Port:	${config.http.port}`;

	const ssoString =
		``;

	const log =
		`=== ${chalk.bold(chalk.bold('Mission Control'))} - Config ===
Debug:		${chalk[config.debug ? 'green' : 'red'](config.debug)}
Base Path:	${config.basePath}
UI Path:	${config.dashboard.path}

${httpString}

SSO:		${chalk[config.auth.sso ? 'green' : 'red']('disabled')}
${ssoString}

	`;

	console.log(log);
}

welcomeLog(require('./app/config'));

