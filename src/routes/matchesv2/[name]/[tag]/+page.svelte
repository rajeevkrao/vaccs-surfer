<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	type Teams = {
		red: number;
		blue: number;
	};

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
		goto(`/match/${matchId}?puuid=${puuid}`);
	}

	let { data }: PageProps = $props();

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

<div class="bg-[#333]">
	{#if data.matchesData.length === 0}
		<p>No matches found.</p>
	{/if}
	{#each data.matchesData as match}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="my-1 flex h-20 items-center gap-10 overflow-hidden text-white"
			style="background-color: {getStatusColorFromText(getWinStatusFromMatch(match))}"
			onclick={() => redirectToMatch(match)}
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
	{/each}
</div>
