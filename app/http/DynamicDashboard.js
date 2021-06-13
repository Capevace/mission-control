const path = require('path');
const fs = require('fs');
const autoBind = require('auto-bind');

/**
 * @typedef {ComponentContent}
 * @property {'vue' | 'html'} type - The content type (vue component or html file)
 * @property {String} path         - The path to the file
 * @property {String} raw          - The raw contents of the file
 */

/**
 * Data for a dashboard component
 * @typedef {Component}
 * @property {String} name
 * @property {ComponentContent} [content = null]
 * @property {object} options
 */

/**
 * Data for a dashboard page
 * @typedef {Page}
 * @property {String} name
 * @property {ComponentContent} [content = null]
 * @property {object} options
 */

class DynamicDashboard {
	constructor(sync) {
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

		autoBind(this);
	}

	get state() {
		return Object.freeze(this.sync.state);
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
		 * @type {Component}
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

				const absolutePath = path.resolve(this.pluginPath, htmlFilePath);

				this.components[name].content = {
					type: 'vue',
					path: absolutePath,
					raw: fs.readFileSync(absolutePath)
				};

				// Read from FS
				// ? Compile
				
				return html;
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
		 * @type {Page}
		 */
		this.dashboard.pages[url] = {
			name,
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

				const absolutePath = path.resolve(this.pluginPath, vueFilePath);

				this.pages[url].content = {
					type: 'vue',
					path: absolutePath,
					raw: fs.readFileSync(absolutePath)
				};

				// Read from FS
				// ? Compile

				return builder;
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

module.exports = DynamicDashboard;