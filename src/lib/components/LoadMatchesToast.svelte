<!--  Use this component in your app:
toast(RichContent, { props: { someProp: '⭐' }}) -->
<script lang="ts">
	import toast_ from 'svelte-french-toast';
	import { Button } from '$lib/components/ui/button/index.js';
	import axios from 'axios';

	type Props = {
		show: boolean;
		batches: number[];
		puuid: string;
		onclose: () => void;
	};

	let { show = $bindable(false), batches, puuid, onclose }: Props = $props();

	async function loadBatches() {
		try {
			for (const batch of batches) {
				console.log('Loading batch:', batch);
				await axios.get(`/api/fetchMatchList?puuid=${puuid}&startIndex=${batch}&size=10`);
			}
			window.location.reload();
		} catch (e) {
			console.error('Error loading batches:', e);
			toast_.error('Failed to all missing matches!');
		}
	}
</script>

{#if show}
	<span class="fixed bottom-1 left-1 rounded-lg bg-white p-4">
		There are more matches!
		<Button onclick={loadBatches}>Load More</Button>

		<button
			class="absolute top-0 right-0"
			onclick={() => {
				show = false;
				onclose();
			}}>X</button
		>
	</span>
{/if}
