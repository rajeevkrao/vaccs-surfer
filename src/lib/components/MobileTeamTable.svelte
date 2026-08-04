<script lang="ts">
	import { generateDistinctColors } from '$lib/utils';
	import Link from '$lib/components/Link.svelte';
	import Warning from '$lib/components/Warning.svelte';
	import { ChevronDown, ChevronUp } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

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

	let expandedPlayer = $state<string | null>(null);

	function toggleExpanded(puuid: string) {
		if (expandedPlayer === puuid) {
			expandedPlayer = null;
		} else {
			expandedPlayer = puuid;
		}
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

	function getAcs(player: any) {
		return Math.floor(player.stats.score / data.match.metadata.rounds_played);
	}

	let highestAcsPuuid = $derived.by(() => {
		const players = [...data.match.players.all_players];
		players.sort((a, b) => getAcs(b) - getAcs(a));
		return players[0]?.puuid;
	});

</script>

<div class="text-white w-full space-y-4">
	<!-- Sorting Controls -->
	<div class="flex flex-col gap-2 bg-gray-800 p-3 rounded-lg shadow-sm mb-4">
		<button class="w-full text-center bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-semibold transition-colors" onclick={toggleGroupByTeam}>
			{groupByTeam ? 'Grouped by Team' : 'Sorted Individually'}
		</button>
		<div class="grid grid-cols-3 gap-2 mt-2">
			<button class="bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs transition-colors {sortColumn === 'acs' ? 'ring-1 ring-blue-500' : ''}" onclick={() => sortBy('acs')}>
				ACS {sortColumn === 'acs' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
			</button>
			<button class="bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs transition-colors {sortColumn === 'kda' ? 'ring-1 ring-blue-500' : ''}" onclick={() => sortBy('kda')}>
				K/D/A {sortColumn === 'kda' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
			</button>
			<button class="bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs transition-colors {sortColumn === 'econ' ? 'ring-1 ring-blue-500' : ''}" onclick={() => sortBy('econ')}>
				Econ {sortColumn === 'econ' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
			</button>
			<button class="bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs transition-colors {sortColumn === 'fb' ? 'ring-1 ring-blue-500' : ''}" onclick={() => sortBy('fb')}>
				FB {sortColumn === 'fb' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
			</button>
			<button class="bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs transition-colors {sortColumn === 'plants' ? 'ring-1 ring-blue-500' : ''}" onclick={() => sortBy('plants')}>
				Plants {sortColumn === 'plants' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
			</button>
			<button class="bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs transition-colors {sortColumn === 'defuses' ? 'ring-1 ring-blue-500' : ''}" onclick={() => sortBy('defuses')}>
				Defuses {sortColumn === 'defuses' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
			</button>
		</div>
	</div>

	<!-- Players List -->
	<div class="flex flex-col gap-2">
		{#each sortedPlayers as player}
			<div class="flex flex-col p-3 rounded-lg shadow border-l-4" style="background-color: #{getPlayerColor(player)}33; border-color: #{getPlayerColor(player)}">
				<div class="flex items-center justify-between">
					<!-- Left: Avatar and Name -->
					<div class="flex items-center gap-3">
						<div class="relative w-12 h-12 flex-shrink-0">
							<img class="w-full h-full rounded-full border border-gray-700 bg-gray-800 object-cover" alt={player.character} src={player.assets.agent.small} />
							{#if data.match.metadata.mode === 'Competitive'}
								<div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full p-0.5">
									<img class="w-4 h-4" title={player.currenttier_patched} alt={player.currenttier} src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${player.currenttier}/smallicon.png`} />
								</div>
							{/if}
						</div>
						<div class="flex flex-col">
							<Link class="font-bold text-[15px] text-white truncate w-[130px] sm:w-[160px]" href={`/matchesv2/${player.puuid}`}>
								{player.name}
							</Link>
							<div class="flex items-center gap-1.5 mt-0.5 flex-wrap w-[130px] sm:w-[160px]">
								{#if player.puuid === highestAcsPuuid}
									<span class="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">MATCH MVP</span>
								{/if}
								{#if parties.find((party) => party.includes(player.puuid))}
									<span class="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10" style="color: {colors[parties.findIndex((party) => party.includes(player.puuid))]};">PARTY</span>
								{/if}
								{#if afkPlayers[player.puuid]}
									<span class="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">AFK {afkPlayers[player.puuid]}</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Right: ACS and KDA -->
					<div class="flex items-center gap-6">
						<div class="w-8 text-center text-sm font-semibold text-white">
							{getAcs(player)}
						</div>
						<div class="flex flex-col items-end w-[72px]">
							<span class="text-sm font-semibold text-white whitespace-nowrap">{player.stats.kills}/{player.stats.deaths}/{player.stats.assists}</span>
							<button class="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white mt-1 uppercase font-semibold" onclick={() => toggleExpanded(player.puuid)}>
								Details
								{#if expandedPlayer === player.puuid}
									<ChevronUp size={12} />
								{:else}
									<ChevronDown size={12} />
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- Expandable Details Section -->
				{#if expandedPlayer === player.puuid}
					<div transition:slide={{ duration: 200 }} class="mt-4 pt-3 border-t border-gray-100/20 grid grid-cols-4 gap-2 text-center pb-1">
						<div class="flex flex-col">
							<span class="text-[10px] text-gray-300 font-semibold uppercase">Econ</span>
							<span class="text-sm font-semibold text-white mt-0.5">{calculateEconRating(player)}</span>
						</div>
						<div class="flex flex-col">
							<span class="text-[10px] text-gray-300 font-semibold uppercase">FB</span>
							<span class="text-sm font-semibold text-white mt-0.5">{calculateFirstBloods(player, data.match)}</span>
						</div>
						<div class="flex flex-col">
							<span class="text-[10px] text-gray-300 font-semibold uppercase">Plants</span>
							<span class="text-sm font-semibold text-white mt-0.5">{calculatePlants(player, data.match)}</span>
						</div>
						<div class="flex flex-col">
							<span class="text-[10px] text-gray-300 font-semibold uppercase">Defuses</span>
							<span class="text-sm font-semibold text-white mt-0.5">{calculateDefuses(player, data.match)}</span>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
