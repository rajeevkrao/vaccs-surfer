<script lang="ts">
	import { ChevronDown, Check, X } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';

	let {
		options = [],
		value = $bindable(''),
		paramName = '',
		placeholder = 'All',
		class: className = 'w-44'
	}: {
		options: string[];
		value: string;
		paramName?: string;
		placeholder?: string;
		class?: string;
	} = $props();

	let isOpen = $state(false);
	let highlightedIndex = $state(-1);
	let containerRef: HTMLDivElement | null = $state(null);
	let triggerRef: HTMLDivElement | null = $state(null);

	// Combine placeholder with other options for navigation
	let allOptions = $derived([placeholder, ...options]);

	// Sync from URL to local state (handles navigation, back/forward button clicks)
	$effect(() => {
		if (!paramName) return;
		const paramVal = $page.url.searchParams.get(paramName) || '';

		untrack(() => {
			if (value !== paramVal) {
				value = paramVal;
			}
		});
	});

	// Sync from local state to URL query parameters
	$effect(() => {
		if (!paramName) return;
		const currentValue = value;

		untrack(() => {
			const url = new URL(window.location.href);
			const paramVal = url.searchParams.get(paramName) || '';

			if (paramVal !== currentValue) {
				if (currentValue) {
					url.searchParams.set(paramName, currentValue);
				} else {
					url.searchParams.delete(paramName);
				}
				goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
			}
		});
	});

	function toggleDropdown() {
		isOpen = !isOpen;
		if (isOpen) {
			const currentVal = value || placeholder;
			const selectedIdx = allOptions.indexOf(currentVal);
			highlightedIndex = selectedIdx !== -1 ? selectedIdx : 0;
			setTimeout(() => {
				scrollIntoView(highlightedIndex);
			}, 0);
		}
	}

	function selectOption(optionVal: string) {
		value = optionVal === placeholder ? '' : optionVal;
		isOpen = false;
		triggerRef?.focus();
	}

	function resetSelection(event: MouseEvent) {
		event.stopPropagation();
		value = '';
		isOpen = false;
	}

	function handleOutsideClick(event: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!isOpen) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === ' ' || event.key === 'Enter') {
				event.preventDefault();
				toggleDropdown();
			}
			return;
		}

		switch (event.key) {
			case 'Escape':
				isOpen = false;
				triggerRef?.focus();
				break;
			case 'Tab':
				isOpen = false;
				break;
			case 'ArrowDown':
				event.preventDefault();
				highlightedIndex = (highlightedIndex + 1) % allOptions.length;
				scrollIntoView(highlightedIndex);
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = (highlightedIndex - 1 + allOptions.length) % allOptions.length;
				scrollIntoView(highlightedIndex);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
					selectOption(allOptions[highlightedIndex]);
				}
				break;
		}
	}

	function scrollIntoView(index: number) {
		const element = containerRef?.querySelector(`[data-index="${index}"]`);
		if (element) {
			element.scrollIntoView({ block: 'nearest' });
		}
	}
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="relative {className}" bind:this={containerRef}>
	<div
		bind:this={triggerRef}
		role="button"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		tabindex="0"
		onkeydown={handleKeyDown}
		class="flex h-10 w-full items-center justify-between rounded-lg border border-slate-700/40 bg-slate-900/60 backdrop-blur-md pl-3.5 pr-2 py-2 text-sm text-slate-200 shadow-md transition-all duration-200 hover:border-blue-500/50 hover:bg-slate-800/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/80 cursor-pointer select-none"
		onclick={toggleDropdown}
	>
		<span class="truncate font-medium pr-1">{value || placeholder}</span>
		<div class="flex items-center gap-1.5 shrink-0">
			{#if value !== ''}
				<button
					type="button"
					class="p-0.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
					onclick={resetSelection}
					title="Clear selection"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			{/if}
			<ChevronDown
				class="h-4 w-4 text-slate-400 transition-transform duration-200 {isOpen ? 'rotate-180 text-white' : ''}"
			/>
		</div>
	</div>

	{#if isOpen}
		<div
			transition:slide={{ duration: 150 }}
			class="custom-scrollbar absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-slate-700/50 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-lg"
			role="listbox"
		>
			{#each allOptions as option, index}
				{@const isPlaceholder = option === placeholder}
				{@const isSelected = value === (isPlaceholder ? '' : option)}
				{@const isHighlighted = index === highlightedIndex}
				<button
					type="button"
					role="option"
					aria-selected={isSelected}
					data-index={index}
					class="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors duration-150 cursor-pointer
						{isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300'}
						{isHighlighted ? 'bg-slate-800/80 text-white' : ''}
						hover:bg-slate-800/60 hover:text-white"
					onclick={() => selectOption(option)}
					onmouseenter={() => (highlightedIndex = index)}
				>
					<span class="truncate">{option}</span>
					{#if isSelected}
						<Check class="h-3.5 w-3.5 text-blue-400 shrink-0 ml-2" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>



