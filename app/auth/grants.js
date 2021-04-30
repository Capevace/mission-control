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
	}
};

module.exports = {
    guest: guestRole,
    user: userRole,
    admin: adminRole
};
