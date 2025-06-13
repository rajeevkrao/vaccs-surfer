import { api } from '../config/index';

export const getMatches = async (name: string, tag: string, region = 'ap') => {
	const response = await api.get(`/v3/matches/${region}/${name}/${tag}`);
	return response.data;
};

export const getMatchesv2 = async (name: string, tag: string, region = 'ap') => {
	const { data: matches } = await api.get(`/v1/stored-matches/${region}/${name}/${tag}`);
	return matches.data;
};

export const getMatch = async (matchId:string) => {
	const { data: match } = await api.get(`v2/match/${matchId}`);
	return match.data;
}
