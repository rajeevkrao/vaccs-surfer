<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';

	import type { InputType, DataType } from '$lib/utils.js';

	let name: string;
	let tag: string;
	let puuid: string;

	let nameEl: any;
	let tagEl: any;
	let puuidEl: any;

	const submit = (inputType: InputType, dataType: DataType) => {
		console.log({ name, tag });
		if (inputType === 'puuid') {
			if (puuid === '' || !puuid) return alert('Please enter a valid PUUID');
		}
		if (inputType === 'nameTag') {
			if (name === '' || tag === '' || !name || !tag)
				return alert('Please enter a valid Name and Tag');
		}

		if (inputType === 'nameTag' || dataType === 'matches') goto(`/matchesv2/${name}/${tag}`);
		if (dataType === 'mmr') {
			if (inputType === 'nameTag') goto(`/mmr?name=${name}&tag=${tag}&inputType=${inputType}`);
			if (inputType === 'puuid') goto(`/mmr?puuid=${puuid}&inputType=${inputType}`);
		}
	};

	const onNameChange = (e: Event) => {
		const input = e.target as HTMLInputElement;
		name = input.value;
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
		<Card.Title>Name & Tag</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="my-2 flex">
			<Input bind:useRef={nameEl} oninput={onNameChange} type="text" bind:value={name} /> # <Input
				type="text"
				bind:value={tag}
				bind:useRef={tagEl}
			/>
		</div>
		<div class="flex justify-end space-x-2">
			<Button on:click={() => submit('nameTag', 'matches')}>Fetch Matches</Button>
			<Button on:click={() => submit('nameTag', 'mmr')}>Fetch MMR</Button>
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="m-2">
	<Card.Header>
		<Card.Title>PUUID</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="my-2 flex">
			<Input bind:useRef={puuidEl} type="text" bind:value={puuid} />
		</div>
		<div class="flex justify-end space-x-2">
			<Button disabled on:click={() => submit('puuid', 'matches')}>Fetch Matches</Button>
			<Button on:click={() => submit('puuid', 'mmr')}>Fetch MMR</Button>
		</div>
	</Card.Content>
</Card.Root>

<svelte:window onkeydown={(e) => e.key === 'Enter' && submit('nameTag', 'mmr')} />
