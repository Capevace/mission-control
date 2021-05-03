/* Plugins are super easy to create */
export default function initPlugin({ logger, sync, dashboard, SCHEMA }) {
	logger.info('Hello World!');
	
	/* Create a service to sync data to dashboards */
	const service = sync.createService('todo')
		.state({
			todos: []
		});
	
	/* Expose actions to dashboard and API. */
	service.createAction('add')
		.permission('create', 'todo', 'own') /* Require permissions to run action */
		.schema({							 /* Validate some input data */
			todo: SCHEMA.object({
				id: Schema.string()
					.required(),
				label: SCHEMA.string()
					.trim()
					.max(256)
					.required()
			})
		})
		.handler((data, context) => { // Handle the action call
			// Do whatever your heart desires here!
			
			const returnData = { /* Maybe return some data...? */ };

			/* You can filter data based on permissions! */
			return context.filter(returnData);
		});
	
	setTimeout(() => {
		service.dispatch('add', )
	});

	return {
		description: 'My custom plugin',
		version: '0.0.1'
	}
}