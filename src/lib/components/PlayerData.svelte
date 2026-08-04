<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { copyToClipboard } from '$lib/utils';
	import toast from 'svelte-french-toast';
	import RankProtectionShield from './RankProtectionShield.svelte';
	import { addRecentAccount } from '$lib/db/indexeddb';
	import PuuidContextMenu from './PuuidContextMenu.svelte';
	import CompetitiveHistoryModal from './CompetitiveHistoryModal.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { getClusterCount, getHsPercentage, getTotalMatches } from '$lib/loggers';

	type $$Props = {
		data: {
			accountData: any;
			mmrData: any;
			matchesData?: any;
		};
	};

	let { data }: $$Props = $props();

	let isMmrModalOpen = $state(false);
	let initialSeasonShort = $state('');

	$effect(() => {
		addRecentAccount({
			name: data.accountData.name,
			tag: data.accountData.tag,
			puuid: data.accountData.puuid
		}).catch(console.error);
	});
</script>

<div class="flex flex-wrap justify-between gap-2">
	<Badge
		class="cursor-pointer bg-blue-500 text-2xl text-white dark:bg-blue-600 hover:bg-blue-600 transition-colors"
		variant="outline"
		onclick={() => {
			copyToClipboard(`${data.accountData.name}#${data.accountData.tag}`);
			toast.success('Copied ID to clipboard!');
		}}
		><span>ID:</span>
		{data.accountData.name}#{data.accountData.tag}</Badge
	>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="outline-none">
			<Badge class="cursor-pointer bg-blue-500 text-2xl text-white dark:bg-blue-600 hover:bg-blue-600 transition-colors" variant="outline"
				><span>Account Level:</span>
				{data.accountData.account_level}</Badge
			>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="popup-animate z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-end-2 data-[side=right]:slide-in-from-start-2 data-[side=top]:slide-in-from-bottom-2">
			{#if data.matchesData}
				<DropdownMenu.Group>
					<DropdownMenu.Label class="px-2 py-1.5 text-sm font-semibold">Servers Played</DropdownMenu.Label>
					{#each Object.entries(getClusterCount(data.matchesData)).sort((a, b) => Number(b[1]) - Number(a[1])) as [cluster, count]}
						<DropdownMenu.Item class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">{cluster}: {count}</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Group>
				<DropdownMenu.Separator class="-mx-1 my-1 h-px bg-muted" />
				<DropdownMenu.Item class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">Total Matches: {getTotalMatches(data.matchesData)}</DropdownMenu.Item>
				<DropdownMenu.Item class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">Headshot: {getHsPercentage(data.matchesData)}%</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<PuuidContextMenu
		name={data.accountData.name}
		tag={data.accountData.tag}
		puuid={data.accountData.puuid}
	>
		<Badge
			title={data.accountData.puuid}
			class="block w-60 cursor-pointer truncate overflow-hidden bg-blue-500 text-left text-2xl text-white dark:bg-blue-600 hover:bg-blue-600 transition-colors"
			variant="outline"
			onclick={() => {
				copyToClipboard(data.accountData.puuid);
				toast.success('Copied PUUID to clipboard!');
			}}
			><span>PUUID:</span>
			{data.accountData.puuid}</Badge
		></PuuidContextMenu
	>

	{#if data.mmrData?.current}
		<Badge 
			class="cursor-pointer bg-blue-500 text-2xl text-white dark:bg-blue-600 hover:bg-blue-600 transition-colors flex items-center gap-1.5" 
			variant="outline"
			onclick={() => {
				initialSeasonShort = '';
				isMmrModalOpen = true;
			}}
			title="Click to view full Competitive History"
		>
			<span>Current:</span>
			<img
				title={data.mmrData.current.tier.name}
				class="h-8"
				alt={data.mmrData.current.tier.id}
				src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${data.mmrData.current.tier.id}/smallicon.png`}
			/>
			{data.mmrData.current.rr.toString().padStart(2, '0')}
			<RankProtectionShield rankData={data.mmrData.current} />
		</Badge>
	{/if}

	{#if data.mmrData?.peak}
		<Badge 
			class="cursor-pointer bg-blue-500 text-2xl text-white dark:bg-blue-600 hover:bg-blue-600 transition-colors flex items-center gap-1.5" 
			variant="outline"
			onclick={() => {
				initialSeasonShort = data.mmrData.peak.season.short;
				isMmrModalOpen = true;
			}}
			title="Click to view full Competitive History"
		>
			<span>Peak[{data.mmrData.peak.season.short}]:</span>
			<img
				title={data.mmrData.peak.tier.name}
				class="h-8"
				alt={data.mmrData.peak.tier.id}
				src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${data.mmrData.peak.tier.id}/smallicon.png`}
			/>
		</Badge>
	{/if}
</div>

<CompetitiveHistoryModal bind:isOpen={isMmrModalOpen} {data} bind:initialSeasonShort />

<style>
	:global(.popup-animate[data-state="open"]) {
		animation: popupFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
	:global(.popup-animate[data-state="closed"]) {
		animation: popupFadeOut 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes popupFadeIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes popupFadeOut {
		from {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
		to {
			opacity: 0;
			transform: scale(0.95) translateY(-4px);
		}
	}
</style>
