import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getAccountByNameTag,
	getMatchesv2ByNameTag,
	getMmrByNameTag
} from '$lib/server/middleware';
import { checkRateLimitReset } from '$lib/utils';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [accountData, matchesData, mmrData] = await Promise.all([
			getAccountByNameTag(params.name, params.tag),
			getMatchesv2ByNameTag(params.name, params.tag),
			getMmrByNameTag(params.name, params.tag)
		]);

		if (!matchesData || matchesData.length === 0) throw error(404, 'No Matches Found');

		return { matchesData, accountData, mmrData };
	} catch (err: any) {
		checkRateLimitReset(err);
		if (err?.status === 404) throw error(404, 'Account not found.');
		throw error(500, 'Internal Server Error');
	}
};
