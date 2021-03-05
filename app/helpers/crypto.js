const bcrypt = require('bcrypt');

/**
 * Compare a password to a hash to see if they match.
 * @async
 * @param  {string} password The unhashed password to check.
 * @param  {string} hash     The hashed password to check against.
 * @return {bool} True if the passwords do match.
 */
module.exports.comparePassword = async function comparePassword(password, hash) {
	try {
		const match = await bcrypt.compare(password, hash);

		return match;
	} catch (e) {
		return false;
	}
};

/**
 * Generate a hash for a given password.
 * @param  {string} password The password to hash.
 * @return {string}          The hash.
 */
module.exports.hashPassword = async function hashPassword(password) {
	return await bcrypt.hash(password, 10);
};

/**
 * Generate a hash for a given password, but sync.
 * @param  {string} password The password to hash.
 * @return {string}          The hash.
 */
module.exports.hashPasswordSync = function hashPasswordSync(password) {
	return bcrypt.hashSync(password, 10);
};
