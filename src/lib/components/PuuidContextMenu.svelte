<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { copyToClipboard } from '$lib/utils';
	import toast from 'svelte-french-toast';

	let { children, name, tag, puuid } = $props();
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{@render children()}
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item
			class="cursor-pointer"
			onclick={() => {
				copyToClipboard(`${name},${tag},${puuid},`);
				toast.success('Copied Account Data in CSV Format to clipboard!');
			}}>Copy CSV Format</ContextMenu.Item
		>
	</ContextMenu.Content>
</ContextMenu.Root>
