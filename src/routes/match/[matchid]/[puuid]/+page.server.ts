import { getMatch } from '$lib/server/middleware';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const match = await getMatch(params.matchid);

	return {
		match
	};
};
