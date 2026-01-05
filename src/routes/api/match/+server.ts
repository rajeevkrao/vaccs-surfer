import { getMatch } from '$lib/server/middleware';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const matchId = url.searchParams.get('matchId') as string;
	const data = await getMatch(matchId);
	return Response.json({ data });
};
