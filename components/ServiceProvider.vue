<template>
	<Provider>
		<slot v-bind="slotProps"></slot>
	</Provider>
</template>
<script>
import Provider from './Provider';

// v-slot="{active, toggle}"
export default {
	components: {
		Provider,
	},
	props: {
		service: {
			type: String,
			required: true,
		},
	},
	data: () => ({
		state: null,
	}),
	fetch() {
		if (process.server) {
			this.state =
				this.$nuxt.context.req.$sync.service('telemetry').state;
		}
	},
	// created() {
	// 	if (process.client) {
	// 		this.$client = this.$sync.service(this.service, (state) => {
	// 			this.ready = true;
	// 			this.state = state;
	// 		});
	// 	}
	// },
	// destroyed() {
	// 	if (this.$client) {
	// 		this.$client.unsubscribe();
	// 	}
	// },
	computed: {
		slotProps() {
			return {
				state: this.state,
				...(this.state || {}),
				invokeAction: this.$invokeAction.bind(this),
			};
		},
	},
	methods: {
		/**
		 * @async
		 */
		$invokeAction() {
			return () => {};
			// return this.$client.action(name, data);
		},
		$stateWithDefault(defaultState = {}) {
			return this.state || defaultState;
			// return this.$client.ready ? this.$state : defaultState;
		},
	},
};
</script>

<style></style>
