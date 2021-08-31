<template>
	<div class="flex w-full min-h-screen app-background">
		<!--	Render main app UI	-->
		<!-- Sidebar -->
		<!-- <top-bar
			@toggle-sidebar="toggleSidebar"
			class="fixed top-0 ease-in-out"
		/> -->

		<div class="w-full">
			<!-- <sidebar
				@toggle-sidebar="toggleSidebar"
				:hidden="sidebarHidden"
				class="max-h-without-header mt-10"
			/> -->

			<section
				class="
					h-full
					max-h-without-double-headerXXX
					md:max-h-without-headerXXX
					transition-margin-left
					ease-in-out
					overflow-hidden
					md:overflow-auto
					flex flex-col
					animate-fade-in
					pt-20
					md:pt-10
				"
			>
				<main
					class="
						bg-black bg-opacity-30
						md:rounded-tl-4xl
						flex-1
						transition-margin-left
						ease-in-out
						relative
						overflow-hidden overflow-y-scroll
					"
				>
					<!-- <SmoothCorner
						class="absolute top-0 left-0 z-0"
						start-color="#4a1b94"
						end-color="#4a1b94"
					/> -->

					<!--  Render main content	-->
					<Nuxt class="router-multi-view z-1 relative h-full" />

					<!-- <portal-target
						name="side-context"
						:transition="slideInComponent"
					></portal-target> -->
				</main>
			</section>

			<!-- <ServiceProvider service="notifications" v-slot="{ notifications }">
				<NotificationGroup
					:remote-notifications="notifications || {}"
				/>
			</ServiceProvider> -->
		</div>
	</div>
</template>
<script>
export default {};
</script>
