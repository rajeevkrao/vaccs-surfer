<script lang="ts">
	import { page } from '$app/stores';
	import TeamTable from '$lib/components/TeamTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let puuid = $derived($page.params.puuid);

	function getWinStatusForPlayer(match: any, puuid: string) {
		const playerTeam = match.players.all_players
			.find((player: any) => player.puuid === puuid)
			?.team.toLowerCase();
		const oppoTeam = playerTeam === 'red' ? 'blue' : 'red';
		const status = match.teams[playerTeam]?.has_won ? 'VICTORY' : 'DEFEAT';
		const text = `${match.teams[playerTeam]?.rounds_won} ${status} ${match.teams[oppoTeam]?.rounds_won}`;
		return text;
	}
</script>
<div class="container bg-[#333]">
	<h1 class="text-center text-white text-5xl">{getWinStatusForPlayer(data.match, puuid)}</h1>
	<TeamTable match={data.match} {puuid}/>
</div>




