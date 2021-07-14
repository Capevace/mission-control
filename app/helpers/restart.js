/**
 * Restart the server
 */
module.exports = async function restart() {
	// We exit with an error to force systemd to restart the server
	process.exit(1);
};