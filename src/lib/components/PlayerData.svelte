<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { copyToClipboard } from '$lib/utils';
	import toast from 'svelte-french-toast';
	import RankProtectionShield from './RankProtectionShield.svelte';
	import { UniqueStack } from '$lib/datatypes';

	type $$Props = {
		data: {
			accountData: any;
			mmrData: any;
		};
	};

	let { data }: $$Props = $props();

	$effect(() => {
		const nameTag = `${data.accountData.name}#${data.accountData.tag}`;

		const raw = localStorage.getItem('recentNameTags');
		const recentNameTags = raw ? new UniqueStack(JSON.parse(raw), 50) : new UniqueStack([], 50);

		recentNameTags.add(nameTag);

		localStorage.setItem('recentNameTags', JSON.stringify(recentNameTags.values()));
	});
</script>

<div class="flex flex-wrap justify-between gap-2">
	<Badge
		class="cursor-pointer bg-blue-500 text-2xl text-white dark:bg-blue-600"
		variant="outline"
		onclick={() => {
			copyToClipboard(`${data.accountData.name}#${data.accountData.tag}`);
			toast.success('Copied ID to clipboard!');
		}}
		><span>ID:</span>
		{data.accountData.name}#{data.accountData.tag}</Badge
	>

	<Badge class="bg-blue-500 text-2xl text-white dark:bg-blue-600" variant="outline"
		><span>Account Level:</span>
		{data.accountData.account_level}</Badge
	>

	<Badge
		title={data.accountData.puuid}
		class="block w-60 cursor-pointer truncate overflow-hidden bg-blue-500 text-left text-2xl text-white dark:bg-blue-600"
		variant="outline"
		onclick={() => {
			copyToClipboard(data.accountData.puuid);
			toast.success('Copied PUUID to clipboard!');
		}}
		><span>PUUID:</span>
		{data.accountData.puuid}</Badge
	>

	{#if data.mmrData}
		<Badge class="bg-blue-500 text-2xl text-white dark:bg-blue-600" variant="outline"
			><span>Current:</span>

			<img
				title={data.mmrData.current.tier.name}
				class="h-8"
				alt={data.mmrData.current.tier.id}
				src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${data.mmrData.current.tier.id}/smallicon.png`}
			/>{data.mmrData.current.rr.toString().padStart(2, '0')}
			<RankProtectionShield rankData={data.mmrData.current} /></Badge
		>
	{/if}

	{#if data.mmrData}
		<Badge class="bg-blue-500 text-2xl text-white dark:bg-blue-600" variant="outline"
			><span>Peak[{data.mmrData.peak.season.short}]:</span>

			<img
				title={data.mmrData.peak.tier.name}
				class="h-8"
				alt={data.mmrData.peak.tier.id}
				src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${data.mmrData.peak.tier.id}/smallicon.png`}
			/>{data.mmrData.peak.rr.toString().padStart(2, '0')}</Badge
		>
	{/if}
</div>

<!-- <div class="flex justify-around text-white">
	<Card.Root class="m-2">
		<Card.Header>
			<Card.Title class="text-center">Current</Card.Title>
		</Card.Header>
		<Card.Content class="flex items-center">
			<img
				title={data.mmrData.current.tier.name}
				class="h-20"
				alt={data.mmrData.current.tier.id}
				src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${data.mmrData.current.tier.id}/smallicon.png`}
			/>
			{data.mmrData.current.rr}
		</Card.Content>
	</Card.Root>

	<Card.Root class="m-2">
		<Card.Header>
			<Card.Title class="text-center">Peak - {data.mmrData.peak.season.short}</Card.Title>
		</Card.Header>
		<Card.Content class="flex items-center">
			<img
				title={data.mmrData.peak.tier.name}
				class="h-20"
				alt={data.mmrData.peak.tier.id}
				src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${data.mmrData.peak.tier.id}/smallicon.png`}
			/>
			{data.mmrData.peak.rr}
		</Card.Content>
	</Card.Root>
</div> -->
