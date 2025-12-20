<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { goto } from '$app/navigation';
	import toast from 'svelte-french-toast';
	import { onMount } from 'svelte';

	import type { InputType, DataType } from '$lib/utils.js';
	import { debounce } from '$lib/utils.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';

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

	let recentNameTags: string[] = [];
	let nameTagSearch: string = '';

	onMount(() => {
		const raw = localStorage.getItem('recentNameTags');
		recentNameTags = raw ? JSON.parse(raw) : [];
	});

	const onSearch = (query: string) => {
		const raw = localStorage.getItem('recentNameTags');
		const storedNameTags = raw ? JSON.parse(raw) : [];
		if (!query) {
			recentNameTags = storedNameTags;
			return;
		}
		recentNameTags = storedNameTags.filter((nameTag: string) =>
			nameTag.toLowerCase().includes(query.toLowerCase())
		);
	};

	const debouncedSearch = debounce(onSearch, 300);

	const submit = (inputType: InputType, dataType: DataType) => {
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

		if (inputType === 'matchId') goto(`/match/${matchId}`);

		if (dataType === 'matches') {
			if (inputType === 'nameTag') goto(`/matchesv2/${name}/${tag}`);
			if (inputType === 'puuid') goto(`/matchesv2/${puuid}`);
		}

		if (dataType === 'mmr') {
			if (inputType === 'nameTag') goto(`/mmr?name=${name}&tag=${tag}&inputType=${inputType}`);
			if (inputType === 'puuid') goto(`/mmr?puuid=${puuid}&inputType=${inputType}`);
		}
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

<Card.Root class="m-2">
	<Card.Header>
		<Card.Title>
			Name & Tag
			<Button
				class="float-right"
				onclick={() => {
					isSheetOpen = true;
				}}>Recents</Button
			>
		</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="my-2 flex">
			<Input
				bind:useRef={nameEl}
				oninput={onNameChange}
				type="text"
				bind:value={name}
				onfocus={() => (inputMode = 'nameTag')}
			/> # <Input
				type="text"
				bind:value={tag}
				bind:useRef={tagEl}
				onfocus={() => (inputMode = 'nameTag')}
			/>
		</div>
		<div class="flex justify-end space-x-2">
			<Button onclick={() => submit('nameTag', 'matches')}>Fetch Matches</Button>
			<Button onclick={() => submit('nameTag', 'mmr')}>Fetch MMR</Button>
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="m-2">
	<Card.Header>
		<Card.Title>PUUID</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="my-2 flex">
			<Input
				bind:useRef={puuidEl}
				type="text"
				bind:value={puuid}
				onfocus={() => (inputMode = 'puuid')}
			/>
		</div>
		<div class="flex justify-end space-x-2">
			<Button onclick={() => submit('puuid', 'matches')}>Fetch Matches</Button>
			<Button onclick={() => submit('puuid', 'mmr')}>Fetch MMR</Button>
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="m-2">
	<Card.Header>
		<Card.Title>MATCH ID</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="my-2 flex">
			<Input
				bind:useRef={matchIdEl}
				type="text"
				bind:value={matchId}
				onfocus={() => (inputMode = 'matchId')}
			/>
		</div>
		<div class="flex justify-end space-x-2">
			<Button onclick={() => submit('matchId', 'matches')}>Fetch Match</Button>
		</div>
	</Card.Content>
</Card.Root>

<Sheet.Root bind:open={isSheetOpen}>
	<Sheet.Content class="max-h-screen overflow-y-auto" side="right">
		<Sheet.Header>
			<Sheet.Title>Recent Visited Accounts</Sheet.Title>
			<!-- <Sheet.Description>Fully controlled, no Trigger component</Sheet.Description> -->
		</Sheet.Header>
		<div class="h-full scroll-auto px-4">
			<Input
				class="mb-2"
				type="text"
				placeholder="Search"
				bind:value={nameTagSearch}
				oninput={(e: any) => debouncedSearch(e.target.value)}
			/>
			{#each recentNameTags as nameTag}<Badge
					onclick={() => {
						const [name, tag] = (nameTag as string).split('#');
						goto(`/matchesv2/${name}/${tag}`);
					}}
					class="m-1 cursor-pointer bg-blue-500 text-lg">{nameTag}</Badge
				>{/each}
		</div>
	</Sheet.Content>
</Sheet.Root>

<svelte:window onkeydown={(e) => e.key === 'Enter' && submit(inputMode, 'matches')} />
