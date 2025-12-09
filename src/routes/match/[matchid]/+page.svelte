<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	import Parties from '$lib/components/Parties.svelte';
	import TeamTable from '$lib/components/TeamTable.svelte';
	import type { PageProps } from './$types';
	import { copyToClipboard } from '$lib/utils';
	import toast from 'svelte-french-toast';

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

<div class="bg-[#333] px-5">
	<div class="flex space-x-2">
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
		<Badge class="bg-blue-500 text-white dark:bg-blue-600" variant="outline"
			>Started At: {new Date(data.match.metadata.game_start * 1000).toLocaleString()}</Badge
		>
		<Badge
			class="block w-40 cursor-pointer truncate overflow-hidden bg-blue-500 text-white dark:bg-blue-600 "
			variant="outline"
			onclick={() => {
				copyToClipboard(data.match.metadata.matchid);
				toast.success('Copied Match ID to clipboard!');
			}}>Match ID: {data.match.metadata.matchid}</Badge
		>
	</div>
	<h1 class="text-center text-5xl text-white">{getWinStatusForPlayer(data.match, data.puuid)}</h1>
	<TeamTable match={data.match} puuid={data.puuid} />
	<Parties match={data.match} />
</div>
