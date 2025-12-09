import { getMatch } from '$lib/server/middleware';
import { checkRateLimitReset } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './[puuid]/$types';

export const load: PageServerLoad = async ({ params, url }) => {
	try {
		const match = await getMatch(params.matchid);
		const puuid = url.searchParams.get('puuid');

		return {
			match,
			puuid
		};
	} catch (err: any) {
		checkRateLimitReset(err);
		if (err?.status === 404) throw error(404, 'Match not found.');
		throw error(500, 'Internal Server Error');
	}
};
