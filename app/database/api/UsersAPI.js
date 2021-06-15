/**
 * @module @database
 * @since 2.0.0
 */

const DatabaseAPI = require('@database/api/DatabaseAPI');

const User = require('@models/User');

const UserError = require('@helpers/UserError');
const crypto = require('@helpers/crypto');
const logger = require('@helpers/logger').createLogger('Users API');

/**
 * Database API for the User model
 */
class UsersAPI extends DatabaseAPI {
	constructor(database) {
		super(database);

		/**
		 * The temporary password to use for the temporary user.
		 * @protected
		 * @type {string}
		 */
		this._tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

		// TODO: Temporary user creation should not be handled in the UsersAPI class
		// 		 Instead a new Defaults class or something should be created that handles all these edge cases.
		const foundUsers = this.database.get('users', {});
		
		// If no users are present, we generate a temporary user account and tell the user in the console
		if (Object.keys(foundUsers).length === 0) {
			logger.newLine();
			logger.warn('WARNING');
			logger.warn('=========================================================');
			logger.warn('No registered users found in DB!');
			logger.warn(`Enabling admin account 'temp' with password '${this._tempPassword}'`);
			logger.newLine();
		}
	}

	/**
	 * Get all users from DB
	 * @return {Object<string, User>} The users map
	 */
	async all() {
		return this.database
			.get('users', { 'temp': User.composeTempUser(this._tempPassword) })
	}

	/**
	 * Set all users in DB
	 * @protected
	 * @param  {Object<string, User>} users
	 */
	async _setUsers(users) {
		this.database.set('users', users);
	}

	/**
	 * Set a User in DB
	 * @protected
	 * @param  {string} username
	 * @param  {User} user
	 */
	async _setUser(username, user) {
		const users = await this.all();
		
		users[username] = User.validate({
			...user,
			username // we make sure, the key we set is the same username as in the user object
		});

		await this._setUsers(users);
	}

	/**
	 * Find User by username
	 * @param  {string} username The username
	 * @return {User | null}          
	 */
	async findUnsafe(username) {
		return (await this.all())[username] || null;
	}

	/**
	 * Find User by username and remove sensitive information
	 * @param  {string} username The username
	 * @return {User | null}          
	 */
	async find(username) {
		const user = await this.findUnsafe(username);

		return user
			? { ...user, password: undefined }
			: null;
	}

	/**
	 * Create a new user
	 * @param  {string} username
	 * @param  {User} userData
	 */
	async create(username, userData) {
		if (await this.find(username))
			throw new UserError(`Username ${username} unavailable`);

		// Password can not be changed in the update method
		await this._setUser(username, {
			...userData,
			password: await crypto.hashPassword(userData.password)
		});
	}

	/**
	 * Delete a User
	 * @param  {string} username
	 */
	async delete(username) {
		// If user does't exist
		if (!await this.find(username)) {
			throw new UserError(`User ${username} doesn't exists`);
		}

		let users = await this.all();
		delete users[username];
		await this._setUsers(users);
	}

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
		const oldUser = await this.findUnsafe(username);

		if (!oldUser)
			throw new UserError(`User ${username} could not be found`);

		// Password can not be changed in the update method
		await this._setUser(username, {
			...oldUser, // First the old user data is the basis
			...userData, // New user data overrides the old (doesn't have to be complete)
			username: oldUser.username, // Make sure username stays the same
			password: oldUser.password // Make sure password wasn't changed
		});
	}

	/**
	 * Hash a users password and save it to DB.
	 * 
	 * @param  {string} username
	 * @param  {string} password
	 */
	async updatePassword(username, password) {
		const oldUser = await this.findUnsafe(username);
		console.log('new password', username, password);
		if (!oldUser)
			throw new UserError(`User ${username} could not be found`);

		await this._setUser(username, {
			...oldUser,
			password: await crypto.hashPassword(password)
		});
	}
}

module.exports = UsersAPI;