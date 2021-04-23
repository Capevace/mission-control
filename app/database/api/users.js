const User = require('@database/models/User');
const crypto = require('@helpers/crypto');
const logger = require('@helpers/logger').createLogger('Database', 'magenta');

module.exports = function initAPI(db) {
	const foundUsers = null//db.get('users', null);
	const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

	// If no users are present, we generate a temporary user account and tell the user in the console
	if (!foundUsers || Object.keys(foundUsers.length)) {
		logger.newLine();
		logger.warn('=========================================================');
		logger.newLine();
		logger.warn('No registered users found in DB!');
		logger.warn(`Enabling admin account 'temp' with password '${tempPassword}'`);
		logger.newLine();
		logger.warn('=========================================================');
		logger.newLine();
	}

	const api = {
		_set: async (users) => db.set('users', users),
		async getAll() {
			return db.get('users', { 'temp': User.composeTempUser(tempPassword) });
		},
		async findUser(username) {
			return (await api.getAll())[username];
		},

		/**
		 * Update the user meta in DB (display name and avatar url).
		 *
		 * This method does NOT allow changing the password.
		 * Only do this with `api.users.updatePassword(<username>, <unhashed-password>)`.
		 *
		 * @param  {string} username Username
		 * @param  {User} user The user object
		 * @return {void}
		 */
		async updateMeta(username, { avatarUrl, displayName }) {
			let users = await api.getUsers();

			if (!users[username])
				throw new Error(`User ${username} could not be found`);

			// Password can not be changed in the update method
			users[username] = User.validate({
				...users[user.username],
				avatarUrl,
				displayName
			});

			await api._set(users);
		},

		/**
		 * Update the user meta in DB (display name and avatar url).
		 *
		 * This method does NOT allow changing the password.
		 * Only do this with `api.users.updatePassword(<username>, <unhashed-password>)`.
		 *
		 * @param  {string} username Username
		 * @param  {User} user The user object
		 * @return {void}
		 */
		async updateUsername(username, newUsername) {
			let users = await api.getUsers();

			if (!users[username])
				throw new Error(`User ${username} could not be found`);

			if (!users[newUsername])
				throw new Error(`Cannot change username. User ${newUsername} already exists.`);

			logger.info(`Changing username from ${username} to ${newUsername}`);

			const newUser = User.validate({
				...users[username],
				username: newUsername
			});

			delete users[username];
			users[newUsername] = newUser;

			await api._set(users);
		},

		/**
		 * Hash a users password and save it to DB.
		 * 
		 * @param  {string} username
		 * @param  {string} password
		 */
		async updatePassword(username, password) {
			let users = await api.getUsers();

			if (!users[username])
				throw new Error(`User ${username} could not be found`);

			users[username] = User.validate({
				...users[username],
				password: crypto.hashPasswordSync(password)
			});

			await api._set(users);
		}
	};

	return api;
}