<script lang="ts">
	export let rankData: any;
</script>

{#if rankData.tier.name.includes('1')}
	<div>
		{#if rankData.rank_protection_shields === 2}
			<img
			class="h-5"
				title="2 Shield Remaining"
				alt="shield 2"
				src="https://media.valorant-api.com/gear/822bcab2-40a2-324e-c137-e09195ad7692/displayicon.png"
			/>
		{/if}
		{#if rankData.rank_protection_shields === 1}
			<img
			class="h-5"
				title="1 Shield Remaining"
				alt="shield 1"
				src="https://media.valorant-api.com/gear/4dec83d5-4902-9ab3-bed6-a7a390761157/displayicon.png"
			/>
		{/if}
	</div>
{/if}
