import { getMatchListByPuuid } from "$lib/server/middleware";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url }) => {
	const puuid = url.searchParams.get("puuid") as string;
	const startIndex = Number(url.searchParams.get("startIndex"));
	const size = Number(url.searchParams.get("size"));

	const matches = await getMatchListByPuuid(puuid, startIndex, size);
	
	return new Response(JSON.stringify(matches));
};