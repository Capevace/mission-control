const path = require('path');
const fs = require('fs');
const autoBind = require('auto-bind');

/**
 * Data for a dashboard component
 * @typedef {DashboardAPI~Component}
 * @property {String} name
 * @property {DashboardAPI~Component~Content} [content = null]
 * @property {object} options
 */

/**
 * @typedef {DashboardAPI~Component~Content}
 * @property {'vue' | 'html'} type - The content type (vue component or html file)
 * @property {String} path         - The path to the file
 * @property {String} raw          - The raw contents of the file
 */

/**
 * Data for a dashboard page
 * @typedef {DashboardAPI~Page}
 * @property {String} name
 * @property {DashboardAPI~Component~Content} [content = null]
 * @property {object} options
 */

/**
 * DashboardAPI class
 * 
 * @class
 * @example
 * 	const DashboardAPI = require('dynamic-dashboard');
 * 	const dashboard = new DashboardAPI({
 * 		sync
 * 	});
 * 
 * 	dashboard
 * 		.component('component-name')
 * 		.html('./component.html')
 * 
 */
class DashboardAPI {
	/**
	 * Create a new DashboardAPI instance
	 * @param {Config} config
	 * @param {Sync} sync - An instance of the Sync system
	 */
	constructor(config, sync) {
		this.sync = sync;
		
		/**
		 * The registered dashboard components
		 * @protected
		 * @type {Object.<Component>}
		 */
		this.components = {};

		/**
		 * The registered dashboard components
		 * @protected
		 * @type {Object.<Page>}
		 */
		this.pages = {};

		this.themeColors = require(path.join(config.dashboard.path, 'themes.json'));

		autoBind(this);
	}

	get state() {
		return Object.freeze(this.sync.state);
	}

	get theme() {
		return this.sync.service('theme').state.theme;
	}

	get themeBackground() {
		return this.themeColors[this.theme]['700'];
	}

	get componentsJson() {
		const json = Object.keys(this.components)
			.reduce((components, componentId) => {
				components[componentId] = {
					name: this.components[componentId].name
				};

				return components;
			}, {});

		return JSON.stringify(json);
	}

	getComponentsHTML() {
		return Object.values(this.components)
			.map((component) => {
				if (component.content === null || component.content.type !== 'custom-html') {
					return '';
				}

				return `<!-- COMPONENT - CUSTOM - ${component.name} -->\n${component.content.raw}\n\n`;
			})
			.reduce((fullHTML, html) => fullHTML + html, '');
	}

	getPagesJSON() {
		return JSON.stringify(Object.values(this.pages));
	}

	/**
	 * Create a new component and return its component builder.
	 * 
	 * @param  {String} name          - Component name (kebab-case)
	 * @return {ComponentBuilder}
	 */
	component(name) {
		if (name in this.components)
			throw new Error(`Component ${name} already exists`);

		/**
		 * @type {DashboardAPI~Component}
		 */
		this.components[name] = {
			name,
			content: null
		};

		/**
		 * @typedef {ComponentBuilder}
		 */
		const builder = {
			/**
			 * Create new Vue component
			 * @param  {String} vueFilePath The path to the .vue component file
			 * @return {ComponentBuilder} Builder for chaining
			 */
			vue: (vueFilePath) => {
				throw new Error('Vue components are not supported yet.');

				// const absolutePath = path.resolve(this.pluginPath, vueFilePath);

				// this.components[name].content = {
				// 	type: 'vue',
				// 	path: absolutePath,
				// 	raw: fs.readFileSync(absolutePath)
				// };

				// // Read from FS
				// // ? Compile
				
				// return html;
			},

			/**
			 * Create component with raw html content
			 * @param  {String} htmlFilePath The path to the .html file
			 * @return {ComponentBuilder} Builder for chaining
			 */
			custom: (htmlFilePath) => {
				const absolutePath = path.resolve(this.pluginPath, htmlFilePath);
				
				this.components[name].content = {
					type: 'custom-html',
					path: absolutePath,
					raw: fs.readFileSync(absolutePath)
				};

				return builder;
			}
		};

		return builder;
	}

	page(url, title) {
		if (url in this.pages)
			throw new Error(`Page at ${url} was already registered`);

		/**
		 * @type {DashboardAPI~Page}
		 */
		this.dashboard.pages[url] = {
			title,
			content: null,
			options: {}
		};

		/**
		 * @typedef {PageBuilder}
		 */
		const builder = {
			/**
			 * Create page with Vue component
			 * @param  {String} vueFilePath The path to the .vue component file
			 * @return {PageBuilder} Builder for chaining
			 */
			vue: (vueFilePath) => {
				throw new Error('Vue components are not supported yet.');

				// const absolutePath = path.resolve(this.pluginPath, vueFilePath);

				// this.pages[url].content = {
				// 	type: 'vue',
				// 	path: absolutePath,
				// 	raw: fs.readFileSync(absolutePath)
				// };

				// // Read from FS
				// // ? Compile

				// return builder;
			},

			/**
			 * Create page with raw html content
			 * @param  {String} htmlFilePath The path to the .html file
			 * @return {PageBuilder} Builder for chaining
			 */
			custom: (htmlFilePath) => {
				const absolutePath = path.resolve(this.pluginPath, htmlFilePath);
				
				this.pages[url].content = {
					type: 'custom-html',
					path: absolutePath,
					raw: fs.readFileSync(absolutePath)
				};

				return builder;
			}
		};
		return builder;
	}
}

module.exports = DashboardAPI;