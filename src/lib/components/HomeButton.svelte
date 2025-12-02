<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let activeHome = $derived(page.url.pathname === '/');

	function gotoHome() {
		goto('/');
	}
</script>

{#if !activeHome}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={() => gotoHome()}
		class="fixed right-2 bottom-2 z-100 rounded-full bg-blue-600 p-4 text-sm text-white transition-colors duration-200 hover:cursor-pointer hover:bg-blue-700"
	>
		<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M3 9.75L12 3L21 9.75V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V9.75Z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9 22V12H15V12"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>
{/if}
