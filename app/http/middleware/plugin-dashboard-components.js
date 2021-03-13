module.exports = function addPluginDashboardComponentsMiddleware(getData) {
	return (req, res, next) => {
		const { components, pages } = getData();

		// Attach dashboard components
		req.componentsHtml = () => {
			let html = Object.values(components)
				.map((component) => `<!-- ${component.name} COMPONENT HTML -->
					${component.contentFn ? component.contentFn() : component.content}
				`)
				.reduce((html, component) => html + component, '');

			return html;

			// return minify(html, {
			// 	minifyJS: true,
			// 	minifyCSS: true
			// });
		};

		req.pagesJson = () => {
			return JSON.stringify(Object.values(pages));
		};

		next();
	};
};