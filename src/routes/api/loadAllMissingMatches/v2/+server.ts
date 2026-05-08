import {
	getCurrentMatchList,
	getMatchesV2ByPuuid,
	getMatchListByPuuid
} from '$lib/server/middleware';
import Promise from 'bluebird';
import type { RequestHandler } from '@sveltejs/kit';
import axios from 'axios';
import { remainingCount } from '$lib/server/config';

const BATCH_SIZE = 10;
const RESERVE_UNITS = 10;

export const GET: RequestHandler = async ({ url }) => {
	const puuid = url.searchParams.get('puuid') as string;

	if (!puuid) {
		return new Response('Bad Request: puuid is required', { status: 400 });
	}

	try {
		const [storedMatches, currentMatchList] = await Promise.all([
			getMatchesV2ByPuuid(puuid),
			getCurrentMatchList(puuid)
		]);

		console.log('Remaining Units Before Batch Processing', remainingCount);

		if (!currentMatchList || currentMatchList.length === 0) {
			return new Response('No matches found', { status: 200 });
		}

		// ✅ Set of already stored match IDs
		const storedMatchIds = new Set(storedMatches.map((m) => m.meta.id));

		// ✅ Extract ordered match IDs
		const currentMatchIds = currentMatchList.map((match) => match.MatchID);

		// ==============================
		// 🔥 STEP 1: Find missing indices
		// ==============================
		const missingIndices: number[] = [];

		for (let i = 0; i < currentMatchIds.length; i++) {
			const matchId = currentMatchIds[i];
			if (!storedMatchIds.has(matchId)) {
				missingIndices.push(i);
			}
		}

		if (missingIndices.length === 0) {
			return new Response('All matches already loaded', { status: 200 });
		}

		// ==============================
		// 🔥 STEP 2: Group into batches
		// ==============================
		const GAP_TOLERANCE = 2; // tweak: 1–2 is usually ideal

		const batches: [number, number][] = [];

		let start = missingIndices[0];
		let prev = start;

		for (let i = 1; i < missingIndices.length; i++) {
			const curr = missingIndices[i];

			const isWithinGap = curr <= prev + 1 + GAP_TOLERANCE;
			const isWithinBatchSize = curr - start + 1 <= BATCH_SIZE;

			if (isWithinGap && isWithinBatchSize) {
				// extend batch (allow small gaps)
				prev = curr;
			} else {
				// close current batch
				batches.push([start, prev]);
				start = curr;
				prev = curr;
			}
		}

		// push last batch
		batches.push([start, prev]);

		// ==============================
		// 🔥 STEP 3: Trim batches (quota-aware)
		// ==============================

		const usable = remainingCount - RESERVE_UNITS;
		let used = 0;
		let cutoffIndex = batches.length; // default: keep all

		for (let i = 0; i < batches.length; i++) {
			const [startIndex, endIndex] = batches[i];
			const size = endIndex - startIndex + 1;
			const cost = size + 1; // matches + API call

			if (used + cost > usable) {
				cutoffIndex = i;
				break;
			}

			used += cost;
		}

		const allIncluded = batches.length === (cutoffIndex + 1);

		// 🔥 Splice batches in-place
		batches.splice(cutoffIndex);

		console.log({ batches });

		// ==============================
		// 🔥 STEP 4: Execute batches
		// ==============================
		await Promise.map(batches, async ([startIndex, endIndex]) => {
			const size = endIndex - startIndex + 1;

			await getMatchListByPuuid(puuid, startIndex, size);
		});

		console.log('Remaining Units After Batch Processing', remainingCount);

		const response = allIncluded
			? 'All missing matches loaded successfully'
			: 'Missing matches partially loaded successfully';

		return new Response(response, { status: 200 });
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 429) {
			const resetTime = err.response.headers['x-ratelimit-reset'];
			return new Response(`Rate limit exceeded. Try again in ${resetTime} seconds`, {
				status: 429
			});
		}

		console.error(err);
		return new Response('Something went wrong while loading missing matches', {
			status: 500
		});
	}
};
