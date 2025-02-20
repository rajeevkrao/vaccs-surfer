<script lang="ts">
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	// @ts-expect-error this error occurs because this is js package
	import ProgressBar from 'svelte-progress-bar';

	import '../app.css';

	let progress: any;
	let { children } = $props();

	onMount(() => {
		beforeNavigate(() => {
			progress.start();
		});

		afterNavigate(() => {
			progress.complete();
		});
	});
</script>

<!-- <div class="border border-gray-500">
	{@render children()}
</div> -->

<ProgressBar color="#0366d6" bind:this={progress} />

{@render children()}
