<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';

	let { children, onLoadAllSmart, onLoadAllBurst } = $props();
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>{@render children()}</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item class="cursor-pointer" onclick={onLoadAllSmart}
			>Load All Missing Matches (Smart)</ContextMenu.Item
		>
		<ContextMenu.Item class="cursor-pointer" onclick={onLoadAllBurst}
			>Load All Missing Matches (Burst)</ContextMenu.Item
		>
	</ContextMenu.Content>
</ContextMenu.Root>
