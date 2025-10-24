import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMatchesV2ByPuuid, getAccountByPuuid, getMmrByPuuid} from '$lib/server/middleware';

export const load: PageServerLoad = async ({ params }) => {
	const matchesData = await getMatchesV2ByPuuid(params.puuid);
	const accountData = await getAccountByPuuid(params.puuid);
	const mmrData = await getMmrByPuuid(params.puuid);

	if (!matchesData || matchesData.length === 0) throw error(404, 'Not found');

	return { matchesData, accountData, mmrData};
};
