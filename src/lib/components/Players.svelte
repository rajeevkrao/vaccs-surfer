<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import CompiTable from './CompiTable.svelte';

	export let players: any;

	const blueTeam = players.blue;
	const redTeam = players.red;
</script>

<div class="container">
	<CompiTable players={blueTeam} caption="Blue Team" />
	<CompiTable players={redTeam} caption="Red Team" />
</div>

<style lang="scss">
	.container {
		display: flex;
	}
</style>
