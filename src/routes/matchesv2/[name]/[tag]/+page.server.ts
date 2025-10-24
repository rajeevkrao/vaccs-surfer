import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAccountByNameTag, getMatchesv2ByNameTag, getMmrByNameTag } from '$lib/server/middleware';

export const load: PageServerLoad = async ({ params }) => {
	const matchesData = await getMatchesv2ByNameTag(params.name, params.tag);
	const accountData = await getAccountByNameTag(params.name, params.tag);
	const mmrData = await getMmrByNameTag(params.name, params.tag);

	if (!matchesData || matchesData.length === 0) throw error(404, 'No Matches Found');

	return { matchesData, accountData, mmrData };
};
