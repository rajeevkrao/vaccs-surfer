<script lang="ts">
	export let href: string;
	let className:string="";

	export { className as class };
</script>

<a class={className} data-sveltekit-preload-data="tap" {href}><slot /></a>
