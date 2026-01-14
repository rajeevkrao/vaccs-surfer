<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';

	let { children, onLoadAll } = $props();
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>{@render children()}</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item class="cursor-pointer" onclick={onLoadAll}
			>Load All Missing Matches</ContextMenu.Item
		>
	</ContextMenu.Content>
</ContextMenu.Root>
