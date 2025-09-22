<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateDistinctColors } from '$lib/utils';

	type $$Props = {
		match: any;
		puuid: string | null;
	};

	let data: $$Props = $props();

	let parties = $derived.by(() => {
		const players = data.match.players.all_players;
		const partyMap: Record<string, string[]> = {};
		players.forEach((player: any) => {
			const partyId = player.party_id;
			if (!partyMap[partyId]) {
				partyMap[partyId] = [];
			}
			partyMap[partyId].push(player.puuid);
		});
		const parties = [];
		for (const value of Object.values(partyMap)) {
			if (value.length > 1) {
				parties.push(value);
			}
		}
		return parties;
	});

	let colors = $derived(generateDistinctColors(parties.length));

	let playerTeam: 'red' | 'blue' = $derived.by(() => {
		const player = data.match.players.all_players.find(
			(player: any) => player.puuid === data.puuid
		);
		const team = (player?.team.toLowerCase() as 'red' | 'blue') || 'blue';
		return team;
	});

	let sortMethod = $state<'acs'>('acs');

	let allPlayers = $state(data.match.players.all_players);

	$effect(() => {
		allPlayers = allPlayers.sort((a: any, b: any) => {
			if (sortMethod === 'acs') {
				return b.stats.score - a.stats.score;
			}
			// Add more sorting methods if needed
			return 0;
		});
	});

	function getPlayerColor(player: any) {
		if (player.puuid === data.puuid) return 'f0cb74';
		return player.team.toLowerCase() === playerTeam ? '1ab2a0' : '9b445b';
	}

	function calculateEconRating(player: any) {
		return Math.floor((player.damage_made / player.economy.spent.overall) * 1000);
	}

	function calculateFirstBloods(player: any, match: any) {
		let countedRounds = new Set<number>();
		let count = 0;

		for (const kill of match.kills) {
			if (kill.killer_puuid === player.puuid && !countedRounds.has(kill.round)) {
				// Check if this player had the first kill in this round
				const firstKillInRound = match.kills.find((k: any) => k.round === kill.round);
				if (firstKillInRound?.killer_puuid === player.puuid) {
					count++;
					countedRounds.add(kill.round);
				}
			}
		}

		return count;
	}

	function calculatePlants(player: any, match: any) {
		let count = 0;
		match.rounds.forEach((round: any) => {
			if (round.plant_events?.planted_by?.puuid === player.puuid) {
				count++;
			}
		});
		return count;
	}

	function calculateDefuses(player: any, match: any) {
		let count = 0;
		match.rounds.forEach((round: any) => {
			if (round.defuse_events?.defused_by?.puuid === player.puuid) {
				count++;
			}
		});
		return count;
	}

	function redirectToPlayersMatch(name: string, tag: string) {
		goto(`/matchesv2/${name}/${tag}`);
	}
</script>

<div class="text-white">
	<table class="w-full text-center text-2xl">
		<thead>
			<tr>
				<th class="border-r border-gray-400 px-4">Player</th>
				<th class="border-l border-r border-gray-400 px-4">ACS</th>
				<th class="border-l border-r border-gray-400 px-4">K/D/A</th>
				<th class="border-l border-r border-gray-400 px-4">Econ Rating</th>
				<th class="border-l border-r border-gray-400 px-4">First Bloods</th>
				<th class="border-l border-r border-gray-400 px-4">Plants</th>
				<th class="border-l border-gray-400 px-4">Defuses</th>
			</tr>
		</thead>
		<tbody>
			{#each allPlayers as player}
				<tr
					onclick={() => redirectToPlayersMatch(player.name, player.tag)}
					style="background-color: #{getPlayerColor(player)}"
				>
					<td class="flex items-center text-left"
						><img
							class="w-[10%]"
							alt={player.assets.agent.small}
							src={player.assets.agent.small}
						/>{#if data.match.metadata.mode === 'Competitive'}<img
								class="w-[10%]"
								title={player.currenttier_patched}
								alt={player.currenttier}
								src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${player.currenttier}/smallicon.png`}
							/>{/if}{player.name}#{player.tag}
						{#if parties.find((party) => party.includes(player.puuid))}<div
								style="color: {colors[
									parties.findIndex((party) => party.includes(player.puuid))
								]};-webkit-text-stroke: .5px black; font-weight: bold; margin-left: 5px; font-family: sans-serif;"
							>
								Party
							</div>{/if}</td
					>
					<td>{Math.floor(player.stats.score / data.match.metadata.rounds_played)}</td>
					<td class="text-nowrap">{player.stats.kills} / {player.stats.deaths} / {player.stats.assists}</td>
					<td>{calculateEconRating(player)}</td>
					<td>{calculateFirstBloods(player, data.match)}</td>
					<td>{calculatePlants(player, data.match)}</td>
					<td>{calculateDefuses(player, data.match)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
