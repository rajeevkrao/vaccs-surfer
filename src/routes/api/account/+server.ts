import { getAccountByNameTag, getAccountByPuuid } from '$lib/server/middleware';
import type { RequestHandler } from '@sveltejs/kit';
import axios from 'axios';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const puuid = url.searchParams.get('puuid');
		const name = url.searchParams.get('name');
		const tag = url.searchParams.get('tag');

		if (!puuid && !(name && tag)) {
			return new Response('Bad Request: puuid or (name and tag) is required', { status: 400 });
		}

		const data = puuid ? await getAccountByPuuid(puuid) : await getAccountByNameTag(name!, tag!);

		return Response.json(data);
	} catch (err) {
		if (axios.isAxiosError(err)) console.log(err?.response?.data);
		return new Response('Something went wrong', { status: 500 });
	}
};
