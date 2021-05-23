const User = require('@models/User');
const UserError = require('@helpers/UserError');
const crypto = require('@helpers/crypto');

const logger = require('@helpers/logger').createLogger('Database', 'magenta');

module.exports = function initAPI(db) {
	const foundUsers = db.get('users', null);
	const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	
	// If no users are present, we generate a temporary user account and tell the user in the console
	if (!foundUsers || Object.keys(foundUsers).length === 0) {
		logger.newLine();
		logger.warn('=========================================================');
		logger.newLine();
		logger.warn('No registered users found in DB!');
		logger.warn(`Enabling admin account 'temp' with password '${tempPassword}'`);
		logger.newLine();
		logger.warn('=========================================================');
		logger.newLine();
	}
	
	/**
	 * Get Users Map from DB
	 * @return {Object<string, User>} The users map
	 */
	const getAllUsers = async () => db.get('users', { 'temp': User.composeTempUser(tempPassword) });

	/**
	 * Set Users Map in DB.
	 * @param  {Object<string, User>} users
	 */
	const setUsers = async (users) => db.set('users', users);

	/**
	 * Set a User in DB
	 * @param  {string} username
	 * @param  {User} user
	 */
	const setUser = async (username, user) => {
		const users = await getAllUsers();
		
		users[username] = User.validate({
			...user,
			username // we make sure, the key we set is the same username as in the user object
		});

		await setUsers(users);
	};

	const usersApi = {
		all: getAllUsers,

		/**
		 * Find User by username
		 * @param  {string} username The username
		 * @return {User | null}          
		 */
		async findUser(username) {
			return (await getAllUsers())[username] || null;
		},

		/**
		 * Find User by username and remove sensitive information
		 * @param  {string} username The username
		 * @return {User | null}          
		 */
		async findSafeUser(username) {
			const user = await usersApi.findUser(username);

			return user
				? { ...user, password: undefined }
				: null;
		},

		/**
		 * Create a new user
		 * @param  {string} username
		 * @param  {User} userData
		 */
		async create(username, userData) {
			const oldUser = await usersApi.findUser(username);

			if (oldUser)
				throw new UserError(`Username ${username} unavailable`);

			// Password can not be changed in the update method
			await setUser(username, {
				...userData,
				password: await crypto.hashPassword(userData.password)
			});
		},

		/**
		 * Delete a User
		 * @param  {string} username
		 */
		async delete(username) {
			const oldUser = await usersApi.findUser(username);

			if (!oldUser)
				throw new UserError(`User ${username} doesn't exists`);

			let users = await getAllUsers();
			delete users[username];
			await setUsers(users);
		},

		/**
		 * Update the user meta in DB (display name and avatar url).
		 *
		 * This method does NOT allow changing the password.
		 * Only do this with `usersApi.users.updatePassword(<username>, <unhashed-password>)`.
		 *
		 * @param  {string} username Username
		 * @param  {User} user The user object
		 * @param  {boolean} shouldCreate Should the user be created if he's not found
		 * @return {void}
		 */
		async update(username, userData) {
			const oldUser = await usersApi.findUser(username);

			if (!oldUser)
				throw new UserError(`User ${username} could not be found`);

			// Password can not be changed in the update method
			await setUser(username, {
				...oldUser,
				...userData,
				username: oldUser.username,
				password: oldUser.password
			});
		},

		/**
		 * Hash a users password and save it to DB.
		 * 
		 * @param  {string} username
		 * @param  {string} password
		 */
		async updatePassword(username, password) {
			const oldUser = await usersApi.findUser(username);

			if (!oldUser)
				throw new UserError(`User ${username} could not be found`);

			await setUser(username, {
				...oldUser,
				password: await crypto.hashPassword(password)
			});
		}
	};

	return usersApi;
}