<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';

	let name: string;
	let tag: string;

	const submit = () => {
		goto(`/matches/${name}/${tag}`);
		console.log(name, tag);
	};
</script>

<div class="input-container">
	<Input type="text" bind:value={name} /> # <Input type="text" bind:value={tag} />
	<Button on:click={submit}>Submit</Button>
</div>

<style lang="scss">
	.input-container {
		display: flex;
	}
</style>
