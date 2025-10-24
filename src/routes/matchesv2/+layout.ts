import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch }) => {
    const response = await fetch(`https://valorant-api.com/v1/gamemodes`);
    const { data } = await response.json();

    return {
        gamemodesData: data
    };
};
