<script lang="ts">
	import MatchList from '$lib/components/MatchList.svelte';
	import PlayerData from '$lib/components/PlayerData.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import { logNameTagPuuidForCsv } from '$lib/loggers';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	$effect(() => {
		logNameTagPuuidForCsv(data.accountData);
	});
</script>

<div
	class="min-h-screen"
	style="background-image: url('/background.jpg'); background-size: cover; background-attachment: fixed; background-position: center;"
>
	<PlayerData {data} />
	<MatchList {data} />
	<ScrollToTop />
</div>
