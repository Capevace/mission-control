const chalk = require('chalk');

module.exports = {
	// Creates a logger with a given title.
	// A color can also be specified but its optional.
	logger: (title, color = 'blue') => (...args) =>
		console.log(`[${chalk[color](title)}]`, ...args),
	custom: () => (...args) => console.log(...args)
};
