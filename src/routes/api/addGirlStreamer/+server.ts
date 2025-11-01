import type { RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { getAccountByNameTag, getAccountByPuuid } from "$lib/server/middleware";
import supabase from "$lib/server/config/supabase";

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();

    const { nameTag, puuid, channelLink, api_key } = data;

    if (api_key !== env.SECRET_KEY) {
        return new Response("Unauthorized", { status: 401 });
    }

    let account;
    if (puuid) {
        account = await getAccountByPuuid(puuid);
    } else if (nameTag) {
        const [name, tag] = nameTag.split("#");
        account = await getAccountByNameTag(name, tag);
    }

    console.log(account);

    const fetchedNameTag = `${account?.name}#${account?.tag}`;
    const fetchedPuuid = account?.puuid;

    await supabase.from("girl-streamers").upsert({
        id: fetchedPuuid,
        nameTag: fetchedNameTag,
        channelLink
    });

    const responseString = `Added streamer: ${fetchedNameTag} with channel link: ${channelLink}`;

    return new Response(responseString);
};