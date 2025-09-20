import { getMatch } from '$lib/server/middleware';
import type { PageServerLoad } from './[puuid]/$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const match = await getMatch(params.matchid);
	const puuid = url.searchParams.get('puuid');

	return {
		match,
		puuid
	};
};
