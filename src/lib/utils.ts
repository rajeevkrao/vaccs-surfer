import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import axios from 'axios';
import { error } from '@sveltejs/kit';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type InputType = 'nameTag' | 'puuid' | 'matchId';
export type DataType = 'matches' | 'mmr';

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export function generateDistinctColors(count = 10, lightness = 40) {
	// Added lightness param, default to 30% for darker shades
	const colors = [];
	for (let i = 0; i < count; i++) {
		const hue = Math.floor((i * 360) / count); // Evenly space hues
		colors.push(`hsl(${hue}, 70%, ${lightness}%)`); // Use provided lightness (lower = darker)
	}
	return colors;
}

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text).catch((err) => {
		console.error('Could not copy text: ', err);
	});
}

export function checkRateLimitReset(err: unknown) {
	if (!axios.isAxiosError(err)) return;
	if (err?.status !== 429) return;
	if (err?.response?.headers?.['x-ratelimit-remaining'] === '0')
		throw error(
			429,
			`Rate limit exceeded. Try Again in ${err.response.headers['x-ratelimit-reset']} seconds`
		);
}

export const selectBatched = (arr: number[], step: number) => {
	// Sort first for correct "next larger" logic
	const sorted = [...arr].sort((a, b) => a - b);

	const result = [];
	let i = 0;
	while (i < sorted.length) {
		const current = sorted[i];
		result.push(current);
		const threshold = current + step;
		i++;
		while (i < sorted.length && sorted[i] < threshold) i++;
	}
	return result;
};

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay = 300) {
	let timer: ReturnType<typeof setTimeout>;

	return (...args: Parameters<T>): void => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn(...args);
		}, delay);
	};
}
