const util = require('util');
const exec = util.promisify(require('child_process').exec);


module.exports = async function restart(password, hash) {
	process.exit(0);
};