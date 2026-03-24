<script lang="ts">
	import { onMount } from 'svelte';

	let showButton = $state(false);

	onMount(() => {
		function handleScroll() {
			showButton = window.scrollY > 300;
		}

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#if showButton}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={() => scrollToTop()}
		class="fixed left-1/2 -translate-x-1/2 top-2 z-100 rounded-full bg-blue-600 p-4 text-sm text-white transition-colors duration-200 hover:cursor-pointer hover:bg-blue-700"
	>
		<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M12 19V5M5 12L12 5L19 12"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>
{/if}
