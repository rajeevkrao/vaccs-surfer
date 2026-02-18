<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/state';

	let retrySeconds = $state(page.error?.retrySeconds ?? 0);
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		if (retrySeconds <= 0) return;

		const endTime = Date.now() + retrySeconds * 1000;

		interval = setInterval(async () => {
			const remaining = Math.ceil((endTime - Date.now()) / 1000);

			retrySeconds = remaining > 0 ? remaining : 0;

			if (remaining <= 0) {
				retrySeconds = 0;
				clearInterval(interval);

				await tick();
				location.reload();
			}
		}, 1000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="text-4xl">
	{#if retrySeconds > 0}
		<p>
			Request Limit Exceeded. Retry in {retrySeconds}s
		</p>
	{:else}
		<p>{page.error?.message}</p>
	{/if}
</div>
