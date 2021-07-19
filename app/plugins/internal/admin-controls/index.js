const restart = require('@helpers/restart');

/**
 * Notification type
 *
 * @typedef {Notification}
 * @property {string} type - Type of notification
 * @property {string} title - Notification title
 * @property {string} [body] - Notification body text
 */

module.exports = function adminControls({
	dashboard,
	sync,
	auth,
	state,
	logger,
	database,
	helpers,
}) {
	const service = sync
		.createService('admin-controls', {
			startedAt: new Date(),
			restarting: false,
		})
		.addFilter((state, { user, permissions }) => {
			return permissions.can(user.role).read('lifecycle', 'any').granted
				? state
				: { restarting: false };
		});

	service
		.action('restart')
		.requirePermission('update', 'lifecycle', 'any')
		.handler(async (data, { state }) => {
			setTimeout(async () => {
				await restart();
			}, 2000);

			state.restarting = true;

			return {
				restartIn: 2000,
				restarting: true,
			};
		});

	dashboard.component('adminControls').custom(__dirname + '/widget.html');

	return {
		internal: true,
		version: '0.0.1',
		description: 'Mission Control lifecycle controls',
	};
};
