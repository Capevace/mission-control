module.exports = function composeModel(schema) {
	return {
		schema,
		validate: (data) => {
			const { error, value } = schema.validate(data);

			if (error) {
				throw error;
			}

			return value;
		}
	}
}