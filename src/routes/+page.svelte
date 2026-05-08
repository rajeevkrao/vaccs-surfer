<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { goto } from '$app/navigation';
	import toast from 'svelte-french-toast';
	import { onMount } from 'svelte';

	import type { InputType } from '$lib/utils.js';
	import { debounce } from '$lib/utils.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { getRecentAccounts, searchRecentAccounts, type RecentAccount } from '$lib/db/indexeddb';

	let name: string;
	let tag: string;
	let puuid: string;
	let matchId: string;

	let nameEl: any;
	let tagEl: any;
	let puuidEl: any;
	let matchIdEl: any;

	let inputMode: InputType = 'nameTag';

	let isSheetOpen = false;

	let recentAccounts: RecentAccount[] = [];
	let nameTagSearch: string = '';

	const loadRecentAccounts = async () => {
		recentAccounts = await getRecentAccounts();
	};

	onMount(() => {
		loadRecentAccounts();
	});

	const onSearch = async (query: string) => {
		if (!query) {
			recentAccounts = await getRecentAccounts();
			return;
		}
		recentAccounts = await searchRecentAccounts(query);
	};

	const debouncedSearch = debounce(onSearch as (query: string) => void, 300);

	const submit = (inputType: InputType) => {
		if (inputType === 'puuid') {
			if (puuid === '' || !puuid)
				return toast.error('Please enter a valid PUUID', { position: 'top-center' });
		}
		if (inputType === 'nameTag') {
			if (name === '' || tag === '' || !name || !tag)
				return toast.error('Please enter a valid Name and Tag', { position: 'top-center' });
		}
		if (inputType === 'matchId') {
			if (matchId === '' || !matchId)
				return toast.error('Please enter a valid Match ID', { position: 'top-center' });
		}

		if (inputType === 'matchId') return goto(`/match/${matchId}`);
		if (inputType === 'nameTag') return goto(`/matchesv2/${name}/${tag}`);
		if (inputType === 'puuid') return goto(`/matchesv2/${puuid}`);
	};

	const onNameChange = (e: Event) => {
		const uuidAnyVersionRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const input = e.target as HTMLInputElement;
		name = input.value;
		if (uuidAnyVersionRegex.test(name)) {
			puuid = name;
			name = '';
			tag = '';
			puuidEl.focus();
		}
		if (name.includes('#')) {
			const [n, t] = name.split('#');
			name = n;
			if (t) {
				tag = t;
				tagEl.focus();
			}
		}
	};
</script>

<div
	class="min-h-screen p-4"
	style="background-image: url('/background.jpg'); background-size: cover; background-attachment: fixed; background-position: center;"
>
	<div class="mx-auto max-w-5xl space-y-6">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<Card.Root
				class="border-l-4 border-none text-white shadow-xl"
				style="background: linear-gradient(135deg, rgba(32, 189, 131, 0.15) 0%, rgba(17, 17, 17, 0.9) 100%); border-left: 4px solid #20bd83 !important;"
			>
				<Card.Header>
					<Card.Title class="flex items-center justify-between text-2xl font-bold">
						Name & Tag
						<Button
							variant="outline"
							size="sm"
							class="border-[#20bd83] bg-transparent text-[#20bd83] hover:bg-[#20bd83] hover:text-white"
							onclick={() => {
								isSheetOpen = true;
							}}>Recents</Button
						>
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="my-4 flex items-center gap-3">
						<Input
							class="border-gray-700 bg-black/40 text-lg text-white"
							bind:useRef={nameEl}
							oninput={onNameChange}
							type="text"
							placeholder="Name"
							bind:value={name}
							onfocus={() => (inputMode = 'nameTag')}
						/>
						<span class="text-2xl font-bold text-gray-500">#</span>
						<Input
							class="border-gray-700 bg-black/40 text-lg text-white"
							type="text"
							placeholder="Tag"
							bind:value={tag}
							bind:useRef={tagEl}
							onfocus={() => (inputMode = 'nameTag')}
						/>
					</div>
					<div class="flex justify-end gap-3">
						<Button
							class="bg-[#20bd83] font-bold text-white hover:bg-[#1a9d6d]"
							onclick={() => submit('nameTag')}>Fetch Matches</Button
						>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root
				class="border-l-4 border-none text-white shadow-xl"
				style="background: linear-gradient(135deg, rgba(3, 102, 214, 0.15) 0%, rgba(17, 17, 17, 0.9) 100%); border-left: 4px solid #0366d6 !important;"
			>
				<Card.Header>
					<Card.Title class="text-2xl font-bold">PUUID</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="my-4 flex">
						<Input
							class="border-gray-700 bg-black/40 text-lg text-white"
							bind:useRef={puuidEl}
							type="text"
							placeholder="Enter PUUID"
							bind:value={puuid}
							onfocus={() => (inputMode = 'puuid')}
						/>
					</div>
					<div class="flex justify-end gap-3">
						<Button
							class="bg-[#0366d6] font-bold text-white hover:bg-[#0256b9]"
							onclick={() => submit('puuid')}>Fetch Matches</Button
						>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<Card.Root
			class="border-l-4 border-none text-white shadow-xl"
			style="background: linear-gradient(135deg, rgba(197, 58, 71, 0.15) 0%, rgba(17, 17, 17, 0.9) 100%); border-left: 4px solid #c53a47 !important;"
		>
			<Card.Header>
				<Card.Title class="text-2xl font-bold">MATCH ID</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="my-4 flex">
					<Input
						class="border-gray-700 bg-black/40 text-lg text-white"
						bind:useRef={matchIdEl}
						type="text"
						placeholder="Enter Match ID"
						bind:value={matchId}
						onfocus={() => (inputMode = 'matchId')}
					/>
				</div>
				<div class="flex justify-end gap-3">
					<Button
						class="bg-[#c53a47] font-bold text-white hover:bg-[#a4303b]"
						onclick={() => submit('matchId')}>Fetch Match</Button
					>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<Sheet.Root bind:open={isSheetOpen}>
	<Sheet.Content class="border-gray-800 bg-[#111] text-white" side="right">
		<Sheet.Header>
			<Sheet.Title class="text-2xl font-bold text-white">Recent Accounts</Sheet.Title>
		</Sheet.Header>
		<div class="mt-6 h-full space-y-4 px-2">
			<Input
				class="border-gray-700 bg-black/40 text-white"
				type="text"
				placeholder="Search recents..."
				bind:value={nameTagSearch}
				oninput={(e: any) => debouncedSearch(e.target.value)}
			/>
			<div class="flex flex-wrap gap-2">
				{#each recentAccounts as account}
					<Badge
						onclick={() => {
							goto(`/matchesv2/${account.puuid}`);
						}}
						class="cursor-pointer border-none bg-[#20bd83]/20 px-3 py-1 text-lg text-[#20bd83] transition-colors hover:bg-[#20bd83] hover:text-white"
					>
						{account.name}#{account.tag}
					</Badge>
				{/each}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<svelte:window onkeydown={(e) => e.key === 'Enter' && submit(inputMode)} />
