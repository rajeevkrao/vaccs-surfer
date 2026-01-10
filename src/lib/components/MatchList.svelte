<script lang="ts">
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { format, subDays } from 'date-fns';
	import Link from './Link.svelte';

	type Teams = {
		red: number;
		blue: number;
	};

	type $$Props = {
		matchesData: any[];
		gamemodesData: any[];
		accountData: any;
	};

	let { data }: { data: $$Props } = $props();

	let missingMatches = $state([]);

	let groupByDate = $derived.by<Record<string, any[]>>(() => {
		const matchesData = data.matchesData.concat(...missingMatches).sort((a, b) => {
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
		const url = data.gamemodesData.find(
			(mode: any) => mode?.displayName === gamemodeName
		)?.displayIcon;
		return url;
	}

	function getStatusColorFromText(text: string) {
		switch (text) {
			case 'VICTORY':
				return '#1ab2a0';
			case 'DEFEAT':
				return '#9b445b';
			default:
				return '#6c757d'; // Default color for DRAW or unknown status
		}
	}
</script>

<div class="mt-3 bg-[#333]">
	{#if data.matchesData.length === 0}
		<p>No matches found.</p>
	{:else}
		{#each Object.entries(groupByDate) as [date, matches]}
			<div class="mx-auto my-2 w-fit rounded-sm bg-blue-500 px-2 py-1 text-lg text-white">
				{date}
			</div>
			{#each matches as match}
				{#if match.meta.partial}
					<Link href={redirectToMatch(match)}>
						<div
							title={format(new Date(match.meta.started_at), 'dd-MMM-yyyy hh:mm:ss aa')}
							class="my-1 flex h-20 items-center px-2 gap-10 overflow-hidden text-white"
							style="background-color: #6c757d"
						>
							Match not loaded - Click to Load
						</div>
					</Link>
				{:else}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<Link href={redirectToMatch(match)}>
						<div
							title={format(new Date(match.meta.started_at), 'dd-MMM-yyyy hh:mm:ss aa')}
							class="my-1 flex h-20 cursor-pointer items-center gap-10 overflow-hidden text-white"
							style="background-color: {getStatusColorFromText(getWinStatusFromMatch(match))}"
						>
							<img
								class="h-full"
								alt={match.stats.character.name}
								src={`https://media.valorant-api.com/agents/${match.stats.character.id}/displayicon.png`}
							/>

							{#if match.meta.mode === 'Competitive'}
								<img
									class="h-[80%]"
									alt={match.stats.tier}
									src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${match.stats.tier}/smallicon.png`}
								/>
							{:else}
								<img
									title={match.meta.mode}
									class="h-[80%]"
									alt={match.meta.mode}
									src={getModeDisplayIcon(match.meta.mode)}
								/>
							{/if}

							<div>
								<div>
									KDA {match.stats.kills} / {match.stats.deaths} / {match.stats.assists}
								</div>
								<div>
									Score {match.stats.score}
								</div>
							</div>

							<div class="mx-auto text-center">
								<div>{getWinStatusFromMatch(match)}</div>
								<div>
									{#if match.meta.mode === 'Deathmatch'}{match.stats.kills}{:else}
										{getScoreString(match.teams, match.stats.team)}{/if}
								</div>
							</div>

							<div class="ml-auto">
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
