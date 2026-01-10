import { getCurrentMatchList } from '$lib/server/middleware';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const puuid = url.searchParams.get('puuid') as string;
	const data = await getCurrentMatchList(puuid);
	return Response.json({ total: data.length, data });
};
