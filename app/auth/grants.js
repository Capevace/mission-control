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
	'service': {
		'update:any': ['*']
	},
	'homebridge': {
		'update:any': ['*']
	},
	'dashboard': {
		'update:any': ['*']
	}
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
	}
};

const systemRole = {
	...adminRole,
	'plugin': {
		'create:any': ['*']
	}
}

module.exports = {
    guest: guestRole,
    user: userRole,
    admin: adminRole,
    system: systemRole
};
