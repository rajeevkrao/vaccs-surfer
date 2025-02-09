<script lang="ts">
	import type { PageProps } from './$types';

	import * as Accordion from '$lib/components/ui/accordion';
	import Players from '$lib/components/Players.svelte';

	let { data }: PageProps = $props();
	const matches = data.data as any;
</script>

<div>
	{#if matches.length === 0}
		<p>No matches found.</p>
	{/if}
	<Accordion.Root>
		{#each matches as match}
			<Accordion.Item value={match.metadata.map}>
				<Accordion.Trigger>{match.metadata.map}</Accordion.Trigger>
				<Accordion.Content>
					<Players players={match.players} />
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</div>
