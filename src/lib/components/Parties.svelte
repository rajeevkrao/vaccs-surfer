<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	type $$Props = {
		match: any;
	};

	let data: $$Props = $props();

	const parties = $derived.by(() => {
		const players = data.match.players.all_players;
		const partyMap: Record<string, string[]> = {};
		players.forEach((player: any) => {
			const partyId = player.party_id;
			if (!partyMap[partyId]) {
				partyMap[partyId] = [];
			}
			partyMap[partyId].push(`${player.name}#${player.tag}`);
		});
		return partyMap;
	});
</script>

<div class="text-white flex flex-wrap justify-evenly">
	{#each Object.values(parties) as players}
		<Card.Root class="m-2">
			<Card.Header>
				<Card.Title>Party Members: {players.length}</Card.Title>
			</Card.Header>
			<Card.Content>
				<ul>
					{#each players as player}
						<li>{player}</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
