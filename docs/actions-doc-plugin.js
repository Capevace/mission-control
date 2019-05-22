exports.handlers = {
	newDoclet: function(e) {
		if (
			e.doclet.examples &&
			e.doclet.examples.includes('demo-action-call')
		) {
			const MAX_PROPERTIES_LINE = 2;
			const properties = e.doclet.properties || [];
			const parameterString = properties.reduce(
				(parameterString, property, index) => {
					const type = property.type.names[0];
					const value = (() => {
						switch (type.toLowerCase()) {
							case 'object':
								return '{}';
							case 'array':
								return '[]';
							case 'string':
							default:
								return `${JSON.stringify(
									property.description
								)}`;
						}
					})();

					return (parameterString += `${
						properties.length > MAX_PROPERTIES_LINE && index === 0
							? '\n    '
							: ''
					}${
						index === 0
							? ''
							: `, ${
									properties.length > MAX_PROPERTIES_LINE
										? '\n    '
										: ''
							  }`
					}${property.name}: ${value}`);
				},
				''
			);

			e.doclet.examples[
				e.doclet.examples.indexOf('demo-action-call')
			] = `state.callAction('${e.doclet.name}', { ${parameterString}${
				properties.length > MAX_PROPERTIES_LINE ? '\n' : ' '
			}})`;

			// console.log('Added Demo Action Call to', e.doclet.name);
		}
	}
};

// const actions = require('../src/state/actions');

// const functionRegex = /function.*\(state, (.+)\)\ {/;

// Object.keys(actions).forEach(action => {
// 	const actionData = actions[action];

// 	console.log('Generating Action', action);

// 	const functionString = actionData.call.toString();
// 	const result = functionRegex.exec(functionString);
// 	let documentation = result ? result[1] : '';

// 	console.log(documentation);
// });
