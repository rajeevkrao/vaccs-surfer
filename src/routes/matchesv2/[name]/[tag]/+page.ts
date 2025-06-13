import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data: serverData, fetch }) => {
	const response = await fetch(`https://valorant-api.com/v1/gamemodes`);
	const { data } = await response.json();
	
	return {
		...serverData,
		gamemodesData: data
	};
};
