const guestRole = {
	action: {
		'create:own': ['*']
	},
	user: {
		'read:own': ['*', '!password']
    }
};

const userRole = {
	...guestRole,
	user: {
		...guestRole.user,
		'update:own': ['*', '!password', '!username']
	},
	'user:password': {
		'update:own': ['*']
	},
	'notification': {
		'create:own': ['*'],
		'read:own': ['*'],
		'update:own': ['*'],
		'delete:own': ['*']
	},
	'service': {
		'update:any': ['*']
	},
	'homebridge': {
		'update:any': ['*']
	},
	'dashboard': {
		'update:any': ['*']
	},
	'theme': {
		'update:own': ['*']
	},
	'weed-mode': {
		'read:any': ['*'],
		'create:any': ['*'],
		'update:any': ['*'],
		'delete:any': ['*']
	},
};

const adminRole = {
	...userRole,
	user: {
		...userRole.user,
		'create:any': ['*'],
		'read:any': ['*', '!password'],
		'update:any': ['*', '!password'],
		'delete:any': ['*']
	},
	'user:password': {
		...userRole['user:password'],
		'update:any': ['*']
	},
	'notification': {
		'create:any': ['*'],
		'read:any': ['*'],
		'update:any': ['*'],
		'delete:any': ['*']
	},
	'lifecycle': {
		'read:any': ['*'],
		'update:any': ['*']
	},
	'theme': {
		'update:any': ['*']
	},
	'dashboard:widget': {
		'read:any': ['*'],
		'create:any': ['*'],
		'update:any': ['*'],
		'delete:any': ['*']
	},
	'spotify:track': {
		'read:any': ['*'],
		'create:any': ['*'],
		'update:any': ['*'],
		'delete:any': ['*']
	},
};

const systemRole = {
	...adminRole,
	'plugin': {
		'create:any': ['*']
	}
};

module.exports = {
    guest: guestRole,
    user: userRole,
    admin: adminRole,
    system: systemRole
};
