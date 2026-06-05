<script lang="ts">
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { format, subDays } from 'date-fns';
	import Link from './Link.svelte';
	import MissingMatchContextMenu from './MissingMatchContextMenu.svelte';
	import toast from 'svelte-french-toast';
	import { CircleChevronUp, CircleChevronDown } from '@lucide/svelte';
	import FilterSelect from './FilterSelect.svelte';

	type Teams = {
		red: number;
		blue: number;
	};

	type $$Props = {
		matchesData: any[];
		gamemodesData: any[];
		accountData: any;
		mmrHistoryData: any;
	};

	let { data }: { data: $$Props } = $props();

	let missingMatches = $state([]);

	let mmrHistory = $derived(data.mmrHistoryData.history);

	let selectedMap = $state('');
	let selectedMode = $state('');

	let nonPartialMatches = $derived(data.matchesData.filter((m: any) => !m.meta.partial));

	let uniqueMaps = $derived(
		[...new Set(nonPartialMatches.map((m: any) => m.meta.map?.name).filter(Boolean))].sort()
	);

	let uniqueModes = $derived(
		[...new Set(nonPartialMatches.map((m: any) => m.meta.mode).filter(Boolean))].sort()
	);

	let filteredMatches = $derived.by(() => {
		let matches = data.matchesData.concat(...missingMatches);
		if (selectedMap) {
			matches = matches.filter((m: any) => m.meta.map?.name === selectedMap);
		}
		if (selectedMode) {
			matches = matches.filter((m: any) => m.meta.mode === selectedMode);
		}
		return matches;
	});

	let groupByDate = $derived.by<Record<string, any[]>>(() => {
		const matchesData = filteredMatches.sort((a, b) => {
			return new Date(b.meta.started_at).getTime() - new Date(a.meta.started_at).getTime();
		});
		const today = format(new Date(), 'dd-MMM-yyyy');
		const yesterday = format(subDays(new Date(), 1), 'dd-MMM-yyyy');
		return matchesData.reduce((acc, item) => {
			const d = format(new Date(item.meta.started_at), 'dd-MMM-yyyy');
			const key = d === today ? 'Today' : d === yesterday ? 'Yesterday' : d;
			(acc[key] ??= []).push(item);
			return acc;
		}, {});
	});

	onMount(async () => {
		const {
			data: { data: currentMatchList }
		} = await axios.get(`/api/getCurrentMatchList?puuid=${data.accountData.puuid}`);
		missingMatches = currentMatchList
			.map((match: any) => ({
				meta: {
					id: match.MatchID,
					mode: match.QueueID,
					started_at: new Date(match.GameStartTime).toISOString(),
					partial: true
				},
				stats: {
					puuid: data.accountData.puuid
				}
			}))
			.filter(
				(match: any) => data.matchesData.findIndex((m) => m.meta.id === match.meta.id) === -1
			);
	});

	async function loadAllMissingMatches(mode: 'smart' | 'burst' = 'burst') {
		const url = mode === 'smart' ? '/api/loadAllMissingMatches/v2' : '/api/loadAllMissingMatches';
		toast.promise(axios.get(`${url}?puuid=${data.accountData.puuid}`), {
			loading: `Loading all missing matches (${mode})...`,
			success: () => {
				window.location.reload();
				return `Successfully loaded all missing matches (${mode})`;
			},
			error: (err) => err?.response?.data || 'Failed to load missing matches'
		});
	}

	function getWinStatusFromMatch(match: any) {
		if (match.meta.mode === 'Deathmatch') {
			if (match.stats.kills === 40) {
				return `VICTORY`;
			} else {
				return `DEFEAT`;
			}
		}
		const teams = match.teams as Teams;
		const inputTeam = match.stats.team as 'Red' | 'Blue';
		const team = inputTeam.toLowerCase() as keyof Teams;
		const otherTeam = team === 'red' ? 'blue' : 'red';
		if (teams[team] > teams[otherTeam]) {
			return `VICTORY`;
		} else if (teams[team] < teams[otherTeam]) {
			return `DEFEAT`;
		}
		return `DRAW`;
	}

	function getScoreString(teams: Teams, inputTeam: 'Red' | 'Blue') {
		const team = inputTeam.toLowerCase() as keyof Teams;
		const otherTeam = team === 'red' ? 'blue' : 'red';
		return `${teams[team]} - ${teams[otherTeam]}`;
	}

	function redirectToMatch(match: any) {
		const matchId = match.meta.id;
		const puuid = match.stats.puuid;
		return `/match/${matchId}?puuid=${puuid}`;

		/* goto(`/match/${matchId}?puuid=${puuid}`); */
	}

	function getModeDisplayIcon(gamemode: string) {
		const gamemodeName = gamemode === 'Unrated' ? 'Standard' : gamemode;
		const url = data.gamemodesData?.find(
			(mode: any) => mode?.displayName === gamemodeName
		)?.displayIcon;
		return url;
	}

	function getStatusColorFromText(text: string) {
		switch (text) {
			case 'VICTORY':
				return '#20bd83';
			case 'DEFEAT':
				return '#c53a47';
			default:
				return '#6c757d'; // Default color for DRAW or unknown status
		}
	}

	function getMmrHistoryForMatch(matchId: string) {
		return mmrHistory?.find((item: any) => item.match_id === matchId);
	}
</script>

<div class="mt-3">
	{#if data.matchesData.length === 0}
		<p>No matches found.</p>
	{:else}
		<div class="mx-auto mb-3 flex max-w-3xl flex-wrap items-center justify-center gap-3">
			<FilterSelect options={uniqueMaps} bind:value={selectedMap} paramName="map" placeholder="All Maps" />
			<FilterSelect options={uniqueModes} bind:value={selectedMode} paramName="mode" placeholder="All Modes" />
		</div>
		{#each Object.entries(groupByDate) as [date, matches]}
			<div class="mx-auto my-2 w-fit rounded-sm bg-blue-500 px-2 py-1 text-lg text-white">
				{date}
			</div>
			{#each matches as match}
				{#if match.meta.partial}
					<MissingMatchContextMenu
						onLoadAllSmart={() => loadAllMissingMatches('smart')}
						onLoadAllBurst={() => loadAllMissingMatches('burst')}
					>
						<Link href={redirectToMatch(match)}>
							<div
								title={format(new Date(match.meta.started_at), 'dd-MMM-yyyy hh:mm:ss aa')}
								class="my-1 flex h-20 items-center gap-10 overflow-hidden px-2 text-white"
								style="background-color: #6c757d"
							>
								Match not loaded - Click to Load
							</div>
						</Link>
					</MissingMatchContextMenu>
				{:else}
					<Link href={redirectToMatch(match)}>
						<div
							title={format(new Date(match.meta.started_at), 'dd-MMM-yyyy hh:mm:ss aa')}
							class="my-1 grid h-20 cursor-pointer grid-cols-3 items-center overflow-hidden border-l-4 text-white"
							style="background: linear-gradient(90deg, {getStatusColorFromText(
								getWinStatusFromMatch(match)
							)}22 0%, #111 100%); border-color: {getStatusColorFromText(
								getWinStatusFromMatch(match)
							)}"
						>
							<div class="flex items-center gap-10">
								<img
									class="h-20"
									alt={match.stats.character.name}
									src={`https://media.valorant-api.com/agents/${match.stats.character.id}/displayicon.png`}
								/>

								{#if match.meta.mode === 'Competitive'}
									{@const history = getMmrHistoryForMatch(match.meta.id)}
									<div class="relative flex h-20 flex-col items-center justify-center">
										<img
											class="h-[70%]"
											alt={match.stats.tier}
											src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${match.stats.tier}/smallicon.png`}
										/>
										{#if history}
											{#if match.stats.tier < history.tier.id}
												<div class="absolute -right-2 top-2 text-[#20bd83]">
													<CircleChevronUp size={16} strokeWidth={3} />
												</div>
											{:else if match.stats.tier > history.tier.id}
												<div class="absolute -right-2 top-2 text-[#c53a47]">
													<CircleChevronDown size={16} strokeWidth={3} />
												</div>
											{/if}
											<div
												class="text-xs font-bold"
												style="color: {history.last_change >= 0 ? '#20bd83' : '#c53a47'}"
											>
												{history.last_change > 0 ? '+' : ''}{history.last_change}
											</div>
										{/if}
									</div>
								{:else}
									<img
										title={match.meta.mode}
										class="h-16"
										alt={match.meta.mode}
										src={getModeDisplayIcon(match.meta.mode)}
									/>
								{/if}

								<div>
									<div>
										KDA {match.stats.kills} / {match.stats.deaths} / {match.stats.assists}
									</div>
									<div class="text-sm opacity-70">
										Score {match.stats.score}
									</div>
								</div>
							</div>

							<div class="text-center">
								<div
									class="text-xl font-bold"
									style="color: {getStatusColorFromText(getWinStatusFromMatch(match))}"
								>
									{getWinStatusFromMatch(match)}
								</div>
								<div class="text-lg opacity-80">
									{#if match.meta.mode === 'Deathmatch'}
										{match.stats.kills}
									{:else}
										{@const [teamScore, otherScore] = getScoreString(
											match.teams,
											match.stats.team
										).split(' - ')}
										<span style="color: {getStatusColorFromText(getWinStatusFromMatch(match))}"
											>{teamScore}</span
										>
										- {otherScore}
									{/if}
								</div>
							</div>

							<div class="flex h-20 justify-end">
								<img
									title={match.meta.map.name}
									class="h-full object-cover [mask-image:linear-gradient(to_right,transparent_0%,black_30%,black_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]"
									alt={match.meta.map.name}
									src={`https://media.valorant-api.com/maps/${match.meta.map.id}/listviewicon.png`}
								/>
							</div>
						</div>
					</Link>
				{/if}
			{/each}
		{/each}
	{/if}
</div>
