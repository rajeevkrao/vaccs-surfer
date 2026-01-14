import {
	getCurrentMatchList,
	getMatchesV2ByPuuid,
	getMatchListByPuuid
} from '$lib/server/middleware';
import { selectBatched } from '$lib/utils';
import type { RequestHandler } from '@sveltejs/kit';
import axios from 'axios';

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

		const storedMatchIds = new Set(storedMatches.map((m) => m.meta.id));

		const missingMatchesIndices = currentMatchList.reduce<number[]>((acc, match, index) => {
			if (!storedMatchIds.has(match.MatchID)) acc.push(index);
			return acc;
		}, []);

		const batches = selectBatched(missingMatchesIndices, 10);

		await Promise.all(batches.map((b) => getMatchListByPuuid(puuid, b, 10)));

		return new Response('Missing Matches Loaded Successfully', { status: 200 });
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 429) {
			const resetTime = err.response.headers['x-ratelimit-reset'];
			return new Response(`Rate limit exceeded. Try Again in ${resetTime} seconds`, {
				status: 429
			});
		}
		throw err;
	}
};
