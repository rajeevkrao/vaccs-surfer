<script lang="ts">
	import MatchList from '$lib/components/MatchList.svelte';
	import PlayerData from '$lib/components/PlayerData.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import { logClusterCount, logHsPercentage, logTotalMatches } from '$lib/loggers';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	$effect(() => {
		logClusterCount(data.matchesData);
		logTotalMatches(data.matchesData);
		logHsPercentage(data.matchesData);
	});
</script>

<div class="bg-[#333]">
	<PlayerData {data} />
	<MatchList {data} />
	<ScrollToTop />
</div>
