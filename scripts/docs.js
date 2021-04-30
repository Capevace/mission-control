#!/usr/bin/env NODE_ENV=production node
const path = require('path');
const fs = require('fs/promises');
const Docma = require('docma');

async function run() {
	const docmaConfig = require('../.config/docma.config.json');
	const root = path.resolve(__dirname, '../');
	const dest = path.resolve(root, docmaConfig.dest);
	console.log('Root:', root, 'Dest:', dest);

	console.log('Building Docma...');
	await Docma.create()
		.build(docmaConfig);

	console.log('Copying Assets...');
	await fs.copyFile(path.join(root, 'resources/favicon.png'), path.join(dest, 'img/favicon.png'));
	await fs.copyFile(path.join(root, 'resources/screenshot-2.0.0-rc6.png'), path.join(dest, 'img/screenshot-2.0.0-rc6.png'));

	console.log('Writing Files...');
	await fs.writeFile(path.join(dest, 'CNAME'), 'mission-control.js.org');


	console.log('Finished! 🚀');
}

run().catch(console.error.bind(console));