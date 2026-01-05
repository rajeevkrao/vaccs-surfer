import { api } from '../config/index';

export const getAccountByNameTag = async (name: string, tag: string) => {
	const { data: account } = await api.get(`/v1/account/${name}/${tag}`);
	return account.data;
};

export const getAccountByPuuid = async (puuid: string) => {
	const { data: account } = await api.get(`/v1/by-puuid/account/${puuid}`);
	return account.data;
};

export const getMatches = async (name: string, tag: string, region = 'ap') => {
	const response = await api.get(`/v3/matches/${region}/${name}/${tag}`);
	return response.data;
};

export const getMatchesv2ByNameTag = async (name: string, tag: string, region = 'ap') => {
	const { data: matches } = await api.get(`/v1/stored-matches/${region}/${name}/${tag}`);
	return matches.data;
};

export const getMatchesV2ByPuuid = async (puuid: string, region = 'ap') => {
	const { data: matches } = await api.get(`/v1/by-puuid/stored-matches/${region}/${puuid}`);
	return matches.data;
};

export const getMmrByPuuid = async (puuid: string, region = 'ap', platform = 'pc') => {
	try {
		const { data: mmr } = await api.get(`/v3/by-puuid/mmr/${region}/${platform}/${puuid}`);
		return mmr.data;
	} catch (err) {
		console.error(err);
		return null;
	}
};

export const getMmrByNameTag = async (
	name: string,
	tag: string,
	region = 'ap',
	platform = 'pc'
) => {
	try {
		const { data: mmr } = await api.get(`/v3/mmr/${region}/${platform}/${name}/${tag}`);
		return mmr.data;
	} catch (err) {
		console.error(err);
		return null;
	}
};

export const getMatch = async (matchId: string) => {
	const { data: match } = await api.get(`v2/match/${matchId}`);
	return match.data;
};

export const getMatchListByPuuid = async (puuid: string, startIndex = 0, size = 5, region = 'ap', platform = 'pc') => {
	const response = await api.get(`/v4/by-puuid/matches/${region}/${platform}/${puuid}?start=${startIndex}&size=${size}`);
	return response.data;
};

export const getCurrentMatchList = async (puuid: string, region = 'ap') => {
	const step = 25;
	const result: any[] = [];
	for (let i = 0; i < 100; i += step) {
		const endIndex = i + step;
		const {
			data: { data }
		} = await api.post(`/v1/raw`, {
			type: 'matchhistory',
			value: puuid,
			region,
			queries: `?startIndex=${i}&endIndex=${endIndex}`
		});
		const { EndIndex, Total, History } = data;
		result.push(...History);
		if (EndIndex === Total) break;
	}
	return result;
};
