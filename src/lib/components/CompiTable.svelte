<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';

	export let players: any;
	export let caption = 'Blue Team';
</script>

<Table.Root>
	<Table.Caption>{caption}</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head>Identifier</Table.Head>
			<Table.Head>Rank</Table.Head>
			<Table.Head>Agent</Table.Head>
			<Table.Head>Score</Table.Head>
			<Table.Head>KDA</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each players as player}
			<Table.Row>
				<Table.Cell>{player.name}#{player.tag}</Table.Cell>
				<Table.Cell>{player.currenttier_patched}</Table.Cell>
				<Table.Cell>{player.character}</Table.Cell>
				<Table.Head>{player.stats.score}</Table.Head>
				<Table.Head
					>{player.stats.kills} - {player.stats.deaths} - {player.stats.assists}</Table.Head
				>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
