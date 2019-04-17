const fs = require('fs');

// Read all files in the actions directory, remove the index and then dynamically load them.
const actionFiles = fs.readdirSync(__dirname);
const actions = actionFiles
	.map(file => file.replace('.js', ''))
	.filter(file => file !== 'index')
	.reduce(
		(all, file) => ({
			...all,
			[file]: require(`./${file}`)
		}),
		{}
	);

module.exports = { getActions: () => actions };
