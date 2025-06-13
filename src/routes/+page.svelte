<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';

	let name: string;
	let tag: string;

	let nameEl: any;
	let tagEl: any;

	const submit = () => {
		goto(`/matchesv2/${name}/${tag}`);
	};

	const onNameChange = (e: Event) => {
		const input = e.target as HTMLInputElement;
		name = input.value;
		if (name.includes('#')) {
			const [n, t] = name.split('#');
			name = n;
			if(t) tag = t;
			tagEl.focus();
		}
	};
</script>

<div class="input-container">
	<Input bind:useRef={nameEl} oninput={onNameChange} type="text" bind:value={name} /> # <Input
		type="text"
		bind:value={tag}
		bind:useRef={tagEl}
	/>
	<Button on:click={submit}>Submit</Button>
</div>

<svelte:window onkeydown={(e) => e.key === 'Enter' && submit()} />

<style lang="scss">
	.input-container {
		display: flex;
	}
</style>
