<template>
	<div>state: {{ state }}!</div>
</template>
<script>
export default {
	asyncData: (context) => {
		let state = null;

		if (process.server) {
			state = context.req.$sync.service('telemetry').state;
		}

		return {
			ready: false,
			state,
		};
	},
};
</script>
