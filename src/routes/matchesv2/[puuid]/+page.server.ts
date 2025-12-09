import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMatchesV2ByPuuid, getAccountByPuuid, getMmrByPuuid } from '$lib/server/middleware';
import { checkRateLimitReset } from '$lib/utils';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [accountData, matchesData, mmrData] = await Promise.all([
			getAccountByPuuid(params.puuid),
			getMatchesV2ByPuuid(params.puuid),
			getMmrByPuuid(params.puuid)
		]);

		if (!matchesData || matchesData.length === 0) throw error(404, 'Not found');

		return { matchesData, accountData, mmrData };
	} catch (err: any) {
		checkRateLimitReset(err);
		if (err?.status === 404) throw error(404, 'Account Not Found');
		throw error(500, 'Internal Server Error');
	}
};
