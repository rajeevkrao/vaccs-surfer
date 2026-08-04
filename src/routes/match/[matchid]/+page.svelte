<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	import Parties from '$lib/components/Parties.svelte';
	import TeamTable from '$lib/components/TeamTable.svelte';
	import MobileTeamTable from '$lib/components/MobileTeamTable.svelte';
	import type { PageProps } from './$types';
	import { copyToClipboard } from '$lib/utils';
	import toast from 'svelte-french-toast';
	import { format } from 'date-fns';

	let { data }: PageProps = $props();

	function secsToTime(seconds: number) {
		const mins = Math.floor(seconds / 60)
			.toString()
			.padStart(2, '0');
		const secs = `${seconds % 60}`.padStart(2, '0');
		return `${mins}:${secs}`;
	}

	function getWinStatusForPlayer(match: any, puuid: string | null) {
		const playerTeam =
			match.players.all_players.find((player: any) => player.puuid === puuid)?.team.toLowerCase() ||
			'blue';
		const oppoTeam = playerTeam === 'red' ? 'blue' : 'red';
		let status = 'DRAW';
		if (match.teams[playerTeam]?.has_won) {
			status = 'VICTORY';
		} else if (match.teams[oppoTeam]?.has_won) {
			status = 'DEFEAT';
		}
		const text = `${match.teams[playerTeam]?.rounds_won} ${status} ${match.teams[oppoTeam]?.rounds_won}`;
		return text;
	}
</script>

<div
	class="min-h-screen px-2 md:px-5"
	style="background-image: url('/background.jpg'); background-size: cover; background-attachment: fixed; background-position: center;"
>
	<div class="flex flex-wrap gap-2 justify-center md:justify-start">
		<Badge class="bg-blue-500 text-white dark:bg-blue-600" variant="outline"
			>Server: {data.match.metadata.cluster}</Badge
		>
		<Badge class="bg-blue-500 text-white dark:bg-blue-600" variant="outline"
			>Mode: {data.match.metadata.mode}</Badge
		>
		<Badge class="bg-blue-500 text-white dark:bg-blue-600" variant="outline"
			>Map: {data.match.metadata.map}</Badge
		>
		<Badge class="bg-blue-500 text-white dark:bg-blue-600" variant="outline"
			>Time: {secsToTime(data.match.metadata.game_length)}</Badge
		>
		<Badge
			class="cursor-pointer bg-blue-500 text-white dark:bg-blue-600"
			variant="outline"
			onclick={() => {
				copyToClipboard(data.match.metadata.game_start);
				toast.success('Copied Match Start Timestamp to clipboard!');
			}}
			>Started At: {format(
				new Date(data.match.metadata.game_start * 1000),
				'dd-MMM-yyyy hh:mm:ss aa'
			)}</Badge
		>
		<Badge
			class="cursor-pointer truncate overflow-hidden bg-blue-500 text-white dark:bg-blue-600 w-full sm:w-auto text-center"
			variant="outline"
			onclick={() => {
				copyToClipboard(data.match.metadata.matchid);
				toast.success('Copied Match ID to clipboard!');
			}}>Match ID: {data.match.metadata.matchid}</Badge
		>
	</div>
	<h1 class="text-center text-4xl md:text-5xl text-white my-4">{getWinStatusForPlayer(data.match, data.puuid)}</h1>
	
	<div class="hidden md:block">
		<TeamTable match={data.match} puuid={data.puuid} />
	</div>
	<div class="block md:hidden">
		<MobileTeamTable match={data.match} puuid={data.puuid} />
	</div>
	
	<Parties match={data.match} />
</div>
