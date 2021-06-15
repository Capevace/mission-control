const crypto = require('../app/helpers/crypto');

process.stdout.write(crypto.hashPasswordSync(process.argv[2]));