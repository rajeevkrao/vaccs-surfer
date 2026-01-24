import { getAccountByPuuid } from '$lib/server/middleware';
import type { RequestHandler } from '@sveltejs/kit';
import axios from 'axios';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const puuid = url.searchParams.get('puuid') as string;
		if (!puuid) {
			return new Response('Bad Request: puuid is required', { status: 400 });
		}
		const data = await getAccountByPuuid(puuid);
		return Response.json(data);
	} catch (err) {
		if (axios.isAxiosError(err)) console.log(err?.response?.data);
		return new Response('Something went wrong', { status: 500 });
	}
};
