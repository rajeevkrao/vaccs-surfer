<script lang="ts">
	import { fade } from 'svelte/transition';
	import { flyAndScale } from '$lib/utils';
	import { X, Trophy, Activity, Percent, Award, TrendingUp } from '@lucide/svelte';

	type $$Props = {
		isOpen: boolean;
		data: {
			accountData: any;
			mmrData: any;
		};
		initialSeasonShort?: string;
	};

	let { isOpen = $bindable(false), data, initialSeasonShort = $bindable('') }: $$Props = $props();

	let selectedSeasonIndex = $state(0);
	let hoverPointIndex = $state<number | null>(null);
	let hoverCoords = $state<{ x: number; y: number } | null>(null);

	let seasonalData = $derived((data.mmrData?.seasonal || []) as any[]);
	let selectedSeason = $derived(seasonalData[selectedSeasonIndex]);

	function selectPeakSeason() {
		const peakSeasonShort = data.mmrData?.peak?.season?.short;
		if (peakSeasonShort) {
			const idx = seasonalData.findIndex(
				(s) => s.season?.short?.toLowerCase() === peakSeasonShort.toLowerCase()
			);
			if (idx !== -1) {
				selectedSeasonIndex = idx;
			}
		}
	}

	$effect(() => {
		if (isOpen && seasonalData.length > 0) {
			if (initialSeasonShort) {
				const idx = seasonalData.findIndex(
					(s) => s.season?.short?.toLowerCase() === initialSeasonShort.toLowerCase()
				);
				if (idx !== -1) {
					selectedSeasonIndex = idx;
					return;
				}
			}
			selectedSeasonIndex = seasonalData.length - 1;
		}
	});

	function handleMouseEnter(idx: number, e: any) {
		hoverPointIndex = idx;
		const rect = e.currentTarget.getBoundingClientRect();
		hoverCoords = {
			x: rect.left + rect.width / 2,
			y: rect.top
		};
	}

	function handleMouseLeave() {
		hoverPointIndex = null;
		hoverCoords = null;
	}

	// Helper to format season names: e1a2 -> Episode 1 - Act 2
	function formatSeasonName(short: string): string {
		if (!short) return 'Unknown Season';
		const match = short.match(/e(\d+)a(\d+)/i);
		if (match) {
			return `Episode ${match[1]} - Act ${match[2]}`;
		}
		return short.toUpperCase();
	}

	// Helper to calculate peak rank for a season
	function getSeasonPeakRank(seasonObj: any) {
		if (!seasonObj) return { id: 0, name: 'Unrated' };
		let peakId = seasonObj.end_tier?.id || 0;
		let peakName = seasonObj.end_tier?.name || 'Unrated';
		if (seasonObj.act_wins) {
			for (const win of seasonObj.act_wins) {
				if (win.id > peakId) {
					peakId = win.id;
					peakName = win.name;
				}
			}
		}
		return { id: peakId, name: peakName };
	}

	// Overall career statistics
	let totalWins = $derived(seasonalData.reduce((acc, s) => acc + (s.wins || 0), 0));
	let totalGames = $derived(seasonalData.reduce((acc, s) => acc + (s.games || 0), 0));
	let totalWinrate = $derived(totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0');

	// Group act wins for current selected season
	let groupedActWins = $derived.by(() => {
		if (!selectedSeason || !selectedSeason.act_wins) return [];
		const groups: Record<number, { id: number; name: string; count: number }> = {};
		selectedSeason.act_wins.forEach((w: any) => {
			if (w.name === 'Unrated') return;
			if (!groups[w.id]) {
				groups[w.id] = { id: w.id, name: w.name, count: 0 };
			}
			groups[w.id].count++;
		});
		return Object.values(groups).sort((a, b) => b.id - a.id);
	});

	// Act wins flat triangle structure (up to top 49 wins, mapped to row/col coordinates)
	let actWinsFlat = $derived.by(() => {
		if (!selectedSeason) return [];
		const winsCount = 49; // 1 + 3 + 5 + 7 + 9 + 11 + 13 = 49
		const topWins = [...(selectedSeason.act_wins || [])]
			.filter((w: any) => w.id > 0)
			.sort((a, b) => b.id - a.id)
			.slice(0, winsCount);

		// Pad with empty items if less than 49 wins
		while (topWins.length < winsCount) {
			topWins.push({ id: 0, name: 'Empty' });
		}

		const flatItems: any[] = [];
		let currentIdx = 0;
		for (let r = 0; r < 7; r++) {
			const colsCount = 2 * r + 1;
			for (let c = 0; c < colsCount; c++) {
				flatItems.push({
					win: topWins[currentIdx++],
					row: r,
					col: c,
					isUp: c % 2 === 0
				});
			}
		}
		return flatItems;
	});

	// Small triangle dimensions for SVG Act Rank
	const triW = 30;
	const triH = 25.98;
	const triCenterX = 120;
	const triYOffset = 12;

	// SVG Graph dimensions & calculations
	const graphWidth = 600;
	const graphHeight = 150;
	const graphPadding = 25;

	let graphPoints = $derived.by(() => {
		if (seasonalData.length === 0) return [];
		const points: { x: number; y: number; season: any; index: number }[] = [];
		const maxTier = Math.max(18, ...seasonalData.map((s: any) => s.end_tier?.id || 0));

		seasonalData.forEach((s: any, idx: number) => {
			const x =
				graphPadding +
				(idx / Math.max(1, seasonalData.length - 1)) * (graphWidth - 2 * graphPadding);
			const tierId = s.end_tier?.id || 0;
			// Scale Y (higher tier ID is closer to top, i.e., smaller Y in SVG)
			const y = graphHeight - graphPadding - (tierId / maxTier) * (graphHeight - 2 * graphPadding);
			points.push({ x, y, season: s, index: idx });
		});
		return points;
	});

	let graphLineD = $derived.by(() => {
		if (graphPoints.length === 0) return '';
		return graphPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	});

	let graphAreaD = $derived.by(() => {
		if (graphPoints.length === 0) return '';
		const first = graphPoints[0];
		const last = graphPoints[graphPoints.length - 1];
		return `${graphLineD} L ${last.x} ${graphHeight - graphPadding} L ${first.x} ${graphHeight - graphPadding} Z`;
	});

	let hoveredPoint = $derived(hoverPointIndex !== null ? graphPoints[hoverPointIndex] : null);
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}}
	onresize={handleMouseLeave}
/>

{#if isOpen}
	<!-- Modal Wrapper -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
		transition:fade={{ duration: 150 }}
	>
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
			onclick={() => (isOpen = false)}
		></div>

		<!-- Modal Container -->
		<div
			class="relative z-10 flex h-[85vh] max-h-[850px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl"
			transition:flyAndScale={{ duration: 200, y: 15, start: 0.98 }}
		>
			<!-- Header / Combined Title & Career Stats -->
			<div
				class="flex flex-col justify-between gap-4 border-b border-slate-800/80 bg-slate-950/40 px-6 py-4 md:flex-row md:items-center"
			>
				<!-- Title Block -->
				<div class="flex min-w-[200px] flex-col">
					<h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
						<Trophy class="h-5 w-5 text-yellow-500" />
						Competitive History
					</h2>
					<p class="mt-0.5 font-mono text-[11px] text-slate-400">
						{data.accountData.name}#{data.accountData.tag}
					</p>
				</div>

				<!-- Compact Career Widgets -->
				<div
					class="mr-2 flex flex-1 flex-wrap items-center justify-start gap-3 md:justify-end md:gap-4"
				>
					<!-- Peak Rank Badge -->
					{#if data.mmrData?.peak}
						<button
							class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/30 bg-slate-800/40 px-2.5 py-1 text-left transition-all hover:bg-slate-700/60 hover:border-slate-600/50 hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
							onclick={selectPeakSeason}
							title="Click to view Peak Season ({data.mmrData.peak.season.short.toUpperCase()}) details"
						>
							<img
								class="h-6 w-6 object-contain"
								alt={data.mmrData.peak.tier.name}
								src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${data.mmrData.peak.tier.id}/smallicon.png`}
							/>
							<div class="flex flex-col text-left font-mono">
								<span
									class="text-[9px] leading-none font-bold tracking-wider text-yellow-500 uppercase"
									>Peak</span
								>
								<span
									class="max-w-[160px] truncate text-xs leading-tight font-semibold text-white"
								>
									{data.mmrData.peak.tier.name}
									{#if data.mmrData.peak.season?.short}
										<span class="font-sans text-[10px] font-normal text-slate-400"
											>({data.mmrData.peak.season.short.toUpperCase()})</span
										>
									{/if}
								</span>
							</div>
						</button>
					{:else}
						<div
							class="flex items-center gap-2 rounded-lg border border-slate-700/30 bg-slate-800/40 px-2.5 py-1"
						>
							<Award class="h-4 w-4 text-slate-500" />
							<span class="text-xs font-semibold text-slate-400">Peak: N/A</span>
						</div>
					{/if}

					<!-- Wins Badge -->
					<div
						class="flex items-center gap-2 rounded-lg border border-slate-700/30 bg-slate-800/40 px-2.5 py-1"
					>
						<Trophy class="h-4 w-4 text-emerald-400" />
						<div class="flex flex-col text-left font-mono">
							<span
								class="text-[9px] leading-none font-bold tracking-wider text-emerald-500 uppercase"
								>Wins</span
							>
							<span class="text-xs leading-tight font-semibold text-white">{totalWins}</span>
						</div>
					</div>

					<!-- Games Played Badge -->
					<div
						class="flex items-center gap-2 rounded-lg border border-slate-700/30 bg-slate-800/40 px-2.5 py-1"
					>
						<Activity class="h-4 w-4 text-blue-400" />
						<div class="flex flex-col text-left font-mono">
							<span class="text-[9px] leading-none font-bold tracking-wider text-blue-500 uppercase"
								>Matches</span
							>
							<span class="text-xs leading-tight font-semibold text-white">{totalGames}</span>
						</div>
					</div>

					<!-- Winrate Badge -->
					<div
						class="flex items-center gap-2 rounded-lg border border-slate-700/30 bg-slate-800/40 px-2.5 py-1"
					>
						<Percent class="h-4 w-4 text-indigo-400" />
						<div class="flex flex-col text-left font-mono">
							<span
								class="text-[9px] leading-none font-bold tracking-wider text-indigo-500 uppercase"
								>Winrate</span
							>
							<span class="text-xs leading-tight font-semibold text-white">{totalWinrate}%</span>
						</div>
					</div>
				</div>

				<!-- Close Button -->
				<button
					class="cursor-pointer self-start rounded-lg bg-slate-800 p-1.5 text-slate-400 transition-all hover:bg-slate-700 hover:text-slate-200 focus:outline-none md:self-auto"
					onclick={() => (isOpen = false)}
					aria-label="Close modal"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Main Modal Area -->
			<div class="flex flex-1 flex-col overflow-hidden md:flex-row">
				<!-- Left Panel: Rank Progression Chart & Seasons List -->
				<div
					class="custom-scrollbar flex w-full flex-col overflow-y-auto border-r border-slate-800/80 bg-slate-950/20 md:w-[45%]"
					onscroll={handleMouseLeave}
				>
					<!-- Chart Section -->
					{#if seasonalData.length > 1}
						<div class="border-b border-slate-800/50 p-4">
							<div class="mb-2 flex items-center justify-between">
								<h3
									class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase"
								>
									<TrendingUp class="h-4 w-4 text-blue-400" />
									Rank Progression
								</h3>
								<span class="font-mono text-[10px] text-slate-500">Hover to inspect</span>
							</div>

							<!-- SVG line graph -->
							<div
								class="relative flex h-[170px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-2"
							>
								<svg
									viewBox="0 0 {graphWidth} {graphHeight}"
									class="h-full w-full overflow-visible"
								>
									<defs>
										<!-- Area gradient -->
										<linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
											<stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
										</linearGradient>
										<!-- Line gradient -->
										<linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
											<stop offset="0%" stop-color="#3b82f6" />
											<stop offset="50%" stop-color="#6366f1" />
											<stop offset="100%" stop-color="#8b5cf6" />
										</linearGradient>
										<!-- Glow filter -->
										<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
											<feGaussianBlur stdDeviation="3" result="blur" />
											<feComposite in="SourceGraphic" in2="blur" operator="over" />
										</filter>
									</defs>

									<!-- Horizontal grid lines -->
									{#each Array(4) as _, i}
										{@const yVal = graphPadding + (i / 3) * (graphHeight - 2 * graphPadding)}
										<line
											x1={graphPadding}
											y1={yVal}
											x2={graphWidth - graphPadding}
											y2={yVal}
											stroke="#334155"
											stroke-width="1"
											stroke-dasharray="3,3"
											opacity="0.3"
										/>
									{/each}

									<!-- Area path -->
									<path d={graphAreaD} fill="url(#area-grad)" />

									<!-- Line path -->
									<path
										d={graphLineD}
										fill="none"
										stroke="url(#line-grad)"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"
										filter="url(#glow)"
									/>

									<!-- Data points (circles) -->
									{#each graphPoints as pt, idx}
										<!-- Invisible larger circle for easier hover -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<circle
											cx={pt.x}
											cy={pt.y}
											r="12"
											fill="transparent"
											class="cursor-pointer"
											onmouseenter={(e) => handleMouseEnter(idx, e)}
											onmouseleave={handleMouseLeave}
											onclick={() => (selectedSeasonIndex = idx)}
										/>
										<!-- Visible circle -->
										<circle
											cx={pt.x}
											cy={pt.y}
											r={selectedSeasonIndex === idx ? '6' : '4'}
											fill={selectedSeasonIndex === idx ? '#8b5cf6' : '#3b82f6'}
											stroke={selectedSeasonIndex === idx ? '#ffffff' : '#0f172a'}
											stroke-width={selectedSeasonIndex === idx ? '2' : '1.5'}
											class="pointer-events-none transition-all duration-150"
										/>
									{/each}
								</svg>
							</div>
						</div>
					{/if}

					<!-- Seasons Selector List -->
					<div class="flex-1 p-4">
						<h3 class="mb-2.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
							Season Directory
						</h3>
						<div class="flex flex-col gap-1.5">
							{#each seasonalData as item, idx}
								{@const peak = getSeasonPeakRank(item)}
								<button
									class="flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left transition-all {selectedSeasonIndex ===
									idx
										? 'border-indigo-500/50 bg-indigo-600/15 text-white shadow-md shadow-indigo-950/20'
										: 'border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700/50 hover:bg-slate-800/30 hover:text-slate-100'}"
									onclick={() => (selectedSeasonIndex = idx)}
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/30 bg-slate-800/80 p-1"
										>
											<img
												class="h-full w-full object-contain"
												alt={peak.name}
												src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${peak.id}/smallicon.png`}
											/>
										</div>
										<div class="flex flex-col">
											<span class="text-sm leading-tight font-semibold text-white"
												>{formatSeasonName(item.season.short)}</span
											>
											<div class="mt-1 flex flex-col gap-0.5">
												<span class="text-[11px] leading-tight text-slate-400">
													<span class="text-amber-500/80">Peak:</span>
													<span class="font-medium text-amber-400/90">{peak.name}</span>
												</span>
												<span class="text-[11px] leading-tight text-slate-400">
													<span class="text-slate-500">Ended:</span>
													{item.end_tier?.name || 'Unrated'}
												</span>
											</div>
										</div>
									</div>
									<div class="flex flex-col items-end font-mono">
										<span class="text-xs font-semibold"
											>{item.wins}W / {item.games - item.wins}L</span
										>
										<span class="text-[10px] text-slate-400"
											>{item.games > 0 ? ((item.wins / item.games) * 100).toFixed(0) : 0}% WR</span
										>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Right Panel: Selected Season Details -->
				<div class="flex flex-1 flex-col overflow-hidden bg-slate-900 p-6">
					{#if selectedSeason}
						{@const peak = getSeasonPeakRank(selectedSeason)}
						<div class="flex min-h-0 flex-1 flex-col gap-4">
							<!-- Header of Details: Compact Row -->
							<div
								class="flex flex-col justify-between gap-4 border-b border-slate-800 pb-3 sm:flex-row sm:items-center"
							>
								<!-- Season Name -->
								<div class="flex flex-col">
									<span class="text-[10px] font-bold tracking-wider text-slate-500 uppercase"
										>Season</span
									>
									<span class="text-base leading-tight font-bold text-white">
										{formatSeasonName(selectedSeason.season.short)}
									</span>
								</div>

								<!-- Ranks & Win Rate Combined inline flex -->
								<div
									class="flex w-full flex-row items-stretch justify-start gap-1.5 sm:w-auto sm:justify-end"
									style="flex-wrap: nowrap !important;"
								>
									<!-- Ended Rank compact -->
									<div
										class="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2 py-0.5"
									>
										<img
											class="h-6 w-6 object-contain"
											alt={selectedSeason.end_tier?.name}
											src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${selectedSeason.end_tier?.id || 0}/smallicon.png`}
										/>
										<div class="flex flex-col text-left">
											<span
												class="text-[8px] leading-none font-bold tracking-wider text-slate-400 uppercase"
												>End Rank</span
											>
											<span
												class="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-200"
											>
												{selectedSeason.end_tier?.name || 'Unrated'}
												{#if selectedSeason.end_rr > 0}
													<span
														class="rounded bg-indigo-500/10 px-1 font-mono text-[9px] font-bold text-indigo-400"
														>{selectedSeason.end_rr} RR</span
													>
												{/if}
											</span>
										</div>
									</div>

									<!-- Peak Rank compact -->
									<div
										class="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2 py-0.5"
									>
										<img
											class="h-6 w-6 object-contain"
											alt={peak.name}
											src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${peak.id}/smallicon.png`}
										/>
										<div class="flex flex-col text-left">
											<span
												class="text-[8px] leading-none font-bold tracking-wider text-amber-500 uppercase"
												>Peak Rank</span
											>
											<span class="mt-0.5 text-xs font-semibold text-amber-400">{peak.name}</span>
										</div>
									</div>

									<!-- Winrate compact -->
									<div
										class="flex min-w-[100px] shrink-0 flex-col justify-center gap-0.5 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2 py-0.5"
									>
										<div class="flex items-center justify-between gap-2 text-[10px] leading-tight">
											<span class="font-mono text-slate-400"
												>{selectedSeason.wins}W - {selectedSeason.games -
													selectedSeason.wins}L</span
											>
											<span class="font-mono font-bold text-white"
												>{selectedSeason.games > 0
													? ((selectedSeason.wins / selectedSeason.games) * 100).toFixed(0)
													: 0}% WR</span
											>
										</div>
										<div class="flex h-1 w-full overflow-hidden rounded-full bg-slate-800/50">
											<div
												class="h-full bg-emerald-500"
												style="width: {selectedSeason.games > 0
													? (selectedSeason.wins / selectedSeason.games) * 100
													: 0}%"
											></div>
											<div
												class="h-full bg-red-500/80"
												style="width: {selectedSeason.games > 0
													? ((selectedSeason.games - selectedSeason.wins) / selectedSeason.games) *
														100
													: 0}%"
											></div>
										</div>
									</div>
								</div>
							</div>

							<!-- Grid: Triangle and Stats Details -->
							<div class="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
								<!-- Act Rank Triangle (Valorant Style) -->
								<div
									class="flex h-full min-h-[300px] shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4 shadow-inner lg:min-h-0"
								>
									<h4
										class="mb-3 flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase"
									>
										<Award class="h-4 w-4 text-indigo-400" />
										Act Rank Wins
									</h4>

									<!-- Triangle SVG -->
									<div class="relative flex shrink-0 items-center justify-center py-2">
										<svg
											width="240"
											height="210"
											viewBox="0 0 240 210"
											class="overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] filter"
										>
											<!-- Inner grid of triangles -->
											{#each actWinsFlat as { win, row, col, isUp }}
												{@const x = triCenterX - (row - col) * (triW / 2) - triW / 2}
												{@const y = triYOffset + row * triH}
												{#if win.id > 0}
													<image
														href={isUp
															? `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${win.id}/ranktriangleupicon.png`
															: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${win.id}/ranktriangledownicon.png`}
														{x}
														{y}
														width={triW}
														height={triH}
														class="transition-all duration-150 hover:brightness-125"
													>
														<title>{win.name}</title>
													</image>
												{:else if isUp}
													<polygon
														points="{x},{y + triH} {x + triW / 2},{y} {x + triW},{y + triH}"
														fill="rgba(15, 23, 42, 0.4)"
														stroke="#334155"
														stroke-width="1"
													/>
												{:else}
													<polygon
														points="{x},{y} {x + triW},{y} {x + triW / 2},{y + triH}"
														fill="rgba(15, 23, 42, 0.4)"
														stroke="#334155"
														stroke-width="1"
													/>
												{/if}
											{/each}

											<!-- Metallic Outer Border Frame Frame (7 rows) -->
											<!-- Outer Glow -->
											<polygon
												points="{triCenterX},{triYOffset - 4} {triCenterX -
													3.5 * triW -
													4},{triYOffset + 7 * triH + 1} {triCenterX + 3.5 * triW + 4},{triYOffset +
													7 * triH +
													1}"
												fill="none"
												stroke="#4f46e5"
												stroke-width="3"
												stroke-linejoin="round"
												class="opacity-30 blur-[2px]"
											/>
											<!-- Inner metallic line -->
											<polygon
												points="{triCenterX},{triYOffset - 2} {triCenterX -
													3.5 * triW -
													2},{triYOffset + 7 * triH} {triCenterX + 3.5 * triW + 2},{triYOffset +
													7 * triH}"
												fill="none"
												stroke="#94a3b8"
												stroke-width="2"
												stroke-linejoin="round"
												class="opacity-70"
											/>
										</svg>
									</div>

									<p class="mt-2 shrink-0 text-center text-[10px] leading-relaxed text-slate-500">
										Shows up to the top 49 wins. Higher tiers are placed closer to the top.
									</p>
								</div>

								<!-- Grouped Win Distribution breakdown -->
								<div class="flex h-full min-h-0 flex-col gap-3">
									<h4
										class="flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase"
									>
										<Activity class="h-4 w-4 text-emerald-400" />
										Win Breakdown
									</h4>

									{#if groupedActWins.length === 0}
										<div
											class="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/40 bg-slate-800/20 p-8 text-slate-500"
										>
											<Award class="mb-2 h-10 w-10 opacity-30" />
											<span class="text-sm font-semibold">No wins recorded</span>
											<span class="text-center text-xs"
												>Wins in competitive match history will appear here.</span
											>
										</div>
									{:else}
										<div
											class="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1"
										>
											{#each groupedActWins as group}
												<div
													class="hover:bg-slate-850/40 flex shrink-0 items-center justify-between rounded-xl border border-slate-700/20 bg-slate-800/30 p-2 transition-colors"
												>
													<div class="flex items-center gap-2.5">
														<img
															class="h-6 w-6 object-contain"
															alt={group.name}
															src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${group.id}/smallicon.png`}
														/>
														<span class="text-sm font-medium text-slate-200">{group.name}</span>
													</div>
													<div class="flex items-center gap-2">
														<span
															class="rounded-full border border-slate-700/80 bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300"
														>
															{group.count}
															{group.count === 1 ? 'Win' : 'Wins'}
														</span>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{:else}
						<div class="flex flex-1 flex-col items-center justify-center p-12 text-slate-500">
							<TrendingUp class="mb-3 h-12 w-12 animate-pulse opacity-30" />
							<span class="text-base font-semibold">No Season Selected</span>
							<span class="text-xs">Select a season from the left directory to view details.</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tooltip overlay -->
		{#if hoveredPoint && hoverCoords}
			{@const peak = getSeasonPeakRank(hoveredPoint.season)}
			<div
				class="pointer-events-none fixed z-[200] flex -translate-x-1/2 -translate-y-[110%] transform flex-col gap-1.5 rounded-xl border border-indigo-500/40 bg-slate-950/95 p-2.5 text-xs shadow-2xl"
				transition:fade={{ duration: 100 }}
				style="left: {hoverCoords.x}px; top: {hoverCoords.y}px;"
			>
				<span class="font-bold text-slate-200"
					>{formatSeasonName(hoveredPoint.season.season.short)}</span
				>
				<div class="mt-0.5 flex flex-col gap-1 border-t border-slate-800/80 pt-1.5">
					<!-- Peak Rank -->
					<div class="flex items-center gap-1.5">
						<img
							class="h-5 w-5 object-contain"
							alt={peak.name}
							src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${peak.id}/smallicon.png`}
						/>
						<span class="flex items-center gap-1 font-semibold text-white">
							<span class="font-bold text-amber-500">Peak:</span>
							{peak.name}
						</span>
					</div>

					<!-- End Rank -->
					<div class="flex items-center gap-1.5">
						<img
							class="h-5 w-5 object-contain"
							alt={hoveredPoint.season.end_tier?.name}
							src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${hoveredPoint.season.end_tier?.id || 0}/smallicon.png`}
						/>
						<span class="flex items-center gap-1 font-semibold text-white">
							<span class="font-normal text-slate-400">Ended:</span>
							{hoveredPoint.season.end_tier?.name || 'Unrated'}
						</span>
					</div>
				</div>
				<span class="font-mono text-[10px] text-slate-400"
					>{hoveredPoint.season.wins} Wins / {hoveredPoint.season.games} Games ({hoveredPoint.season
						.games > 0
						? ((hoveredPoint.season.wins / hoveredPoint.season.games) * 100).toFixed(0)
						: 0}% WR)</span
				>
			</div>
		{/if}
	</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #334155; /* slate-700 */
		border-radius: 9999px;
		transition: background-color 0.2s ease;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #4f46e5; /* indigo-600 */
	}

	/* Firefox scrollbar styling */
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: #334155 transparent;
	}
</style>
