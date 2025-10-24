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
	const { data: mmr } = await api.get(`/v3/by-puuid/mmr/${region}/${platform}/${puuid}`);
	return mmr.data;
};

export const getMmrByNameTag = async (name: string, tag: string, region = 'ap', platform = 'pc') => {
	const { data: mmr } = await api.get(`/v3/mmr/${region}/${platform}/${name}/${tag}`);
	return mmr.data;
};

export const getMatch = async (matchId: string) => {
	const { data: match } = await api.get(`v2/match/${matchId}`);
	return match.data;
};
