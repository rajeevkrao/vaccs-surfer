import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '../../$types';
import { getMatches } from '$lib/server/middleware';

export const load: PageServerLoad = async ({ params }) => {
	const matches = await getMatches(params.name, params.tag);

	if (matches) {
		return matches;
	}

	error(404, 'Not found');
};
