<script lang="ts">
	import { generateDistinctColors } from '$lib/utils';
	import Link from '$lib/components/Link.svelte';
	import Warning from '$lib/components/Warning.svelte';

	const acsTooltip = `DAMAGE: 1 point each\nKILLS based on enemies alive: 150 / 130 / 110 / 90 / 70\nMULTIKILLS: +50 per additional kill\nNON-DAMAGING ASSISTS: 25`;
	// Don't remove below comment this text will be added after a feature
	// \nROUND SCORES: viewed in the timeline

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

	let afkPlayers = $derived.by(() => {
		const playersObj: any = {};
		data.match.rounds.forEach((round: any) => {
			round.player_stats.forEach((player: any) => {
				if (player.was_afk) {
					if (!playersObj[player.player_puuid]) {
						playersObj[player.player_puuid] = 1;
					} else {
						playersObj[player.player_puuid]++;
					}
				}
			});
		});
		return playersObj;
	});

	let playerTeam: 'red' | 'blue' = $derived.by(() => {
		const player = data.match.players.all_players.find(
			(player: any) => player.puuid === data.puuid
		);
		const team = (player?.team.toLowerCase() as 'red' | 'blue') || 'blue';
		return team;
	});

	let groupByTeam = $state(false);
	let sortColumn = $state<'acs' | 'kda' | 'econ' | 'fb' | 'plants' | 'defuses'>('acs');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	function toggleGroupByTeam() {
		groupByTeam = !groupByTeam;
	}

	function sortBy(col: typeof sortColumn) {
		if (sortColumn === col) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = col;
			sortDirection = 'desc';
		}
	}

	function getColumnValue(player: any, col: typeof sortColumn) {
		switch (col) {
			case 'acs':
				return player.stats.score;
			case 'kda':
				return player.stats.kills;
			case 'econ':
				return calculateEconRating(player);
			case 'fb':
				return calculateFirstBloods(player, data.match);
			case 'plants':
				return calculatePlants(player, data.match);
			case 'defuses':
				return calculateDefuses(player, data.match);
			default:
				return 0;
		}
	}

	let sortedPlayers = $derived.by(() => {
		const playersCopy = [...data.match.players.all_players];
		
		playersCopy.sort((a: any, b: any) => {
			if (groupByTeam) {
				const teamA = a.team.toLowerCase();
				const teamB = b.team.toLowerCase();
				if (teamA !== teamB) {
					return teamA === playerTeam ? -1 : 1;
				}
			}

			const valA = getColumnValue(a, sortColumn);
			const valB = getColumnValue(b, sortColumn);

			if (sortDirection === 'asc') {
				return valA - valB;
			} else {
				return valB - valA;
			}
		});

		return playersCopy;
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

	/* function redirectToPlayersMatch(name: string, tag: string) {
		goto(`/matchesv2/${name}/${tag}`);
	} */
</script>

<div class="text-white">
	<table class="w-full text-center text-2xl">
		<thead>
			<tr>
				<th class="border-r border-gray-400 px-4 cursor-pointer select-none text-nowrap hover:text-gray-300" onclick={toggleGroupByTeam}>
					{groupByTeam ? 'Group by Team' : 'Individually Sorted'}
				</th>
				<th 
					class="border-r border-l border-gray-400 px-4 cursor-pointer select-none text-nowrap hover:text-gray-300" 
					onclick={() => sortBy('acs')}
					title={acsTooltip}
				>
					ACS {sortColumn === 'acs' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
				</th>
				<th class="border-r border-l border-gray-400 px-4 cursor-pointer select-none text-nowrap hover:text-gray-300" onclick={() => sortBy('kda')}>
					K/D/A {sortColumn === 'kda' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
				</th>
				<th class="border-r border-l border-gray-400 px-4 cursor-pointer select-none text-nowrap hover:text-gray-300" onclick={() => sortBy('econ')}>
					Econ Rating {sortColumn === 'econ' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
				</th>
				<th class="border-r border-l border-gray-400 px-4 cursor-pointer select-none text-nowrap hover:text-gray-300" onclick={() => sortBy('fb')}>
					First Bloods {sortColumn === 'fb' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
				</th>
				<th class="border-r border-l border-gray-400 px-4 cursor-pointer select-none text-nowrap hover:text-gray-300" onclick={() => sortBy('plants')}>
					Plants {sortColumn === 'plants' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
				</th>
				<th class="border-l border-gray-400 px-4 cursor-pointer select-none text-nowrap hover:text-gray-300" onclick={() => sortBy('defuses')}>
					Defuses {sortColumn === 'defuses' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedPlayers as player}
				<tr style="background-color: #{getPlayerColor(player)}">
					<td class="flex items-center text-left"
						><img
							class="w-[10%]"
							alt={player.character}
							src={player.assets.agent.small}
						/>{#if data.match.metadata.mode === 'Competitive'}<img
								class="w-[10%]"
								title={player.currenttier_patched}
								alt={player.currenttier}
								src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${player.currenttier}/smallicon.png`}
							/>{/if}<Link class="cursor-pointer" href={`/matchesv2/${player.puuid}`}
							><span title={player.puuid}>{player.name}#{player.tag}</span></Link
						>
						{#if parties.find((party) => party.includes(player.puuid))}<div
								style="color: {colors[
									parties.findIndex((party) => party.includes(player.puuid))
								]};-webkit-text-stroke: .5px black; font-weight: bold; margin-left: 5px; font-family: sans-serif;"
							>
								Party
							</div>
						{/if}
						{#if afkPlayers[player.puuid]}
							<Warning title={`AFK for ${afkPlayers[player.puuid]} rounds`} color="yellow" />
						{/if}
					</td>
					<td>{Math.floor(player.stats.score / data.match.metadata.rounds_played)}</td>
					<td class="text-nowrap"
						>{player.stats.kills} / {player.stats.deaths} / {player.stats.assists}</td
					>
					<td>{calculateEconRating(player)}</td>
					<td>{calculateFirstBloods(player, data.match)}</td>
					<td>{calculatePlants(player, data.match)}</td>
					<td>{calculateDefuses(player, data.match)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
