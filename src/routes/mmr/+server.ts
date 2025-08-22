import { getMmrByNameTag, getMmrByPuuid } from '$lib/server/middleware';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	console.log(url);
	const inputType = url.searchParams.get('inputType');
	const puuid = url.searchParams.get('puuid');
	const name = url.searchParams.get('name');
	const tag = url.searchParams.get('tag');

	console.log({ inputType, puuid, name, tag });

	if (inputType === 'puuid' && !puuid) {
		return new Response('Invalid PUUID', { status: 400 });
	}
	if (inputType === 'nameTag' && (!name || !tag)) {
		return new Response('Invalid Name or Tag', { status: 400 });
	}

	if (inputType === 'puuid') {
		const mmr = await getMmrByPuuid(puuid as string);
		return Response.json(mmr);
	}

	if (inputType === 'nameTag') {
		const mmr = await getMmrByNameTag(name as string, tag as string);
		return Response.json(mmr);
	}

	return new Response('Error Fetching MMR', { status: 500 });
};
