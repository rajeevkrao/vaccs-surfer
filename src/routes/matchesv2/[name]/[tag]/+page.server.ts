import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMatchesv2 } from '$lib/server/middleware';

export const load: PageServerLoad = async ({ params }) => {
	const matchesData = await getMatchesv2(params.name, params.tag);

	if (!matchesData || matchesData.length === 0) throw error(404, 'Not found');

	return { matchesData };
};
