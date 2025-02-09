import { api } from '../config/index';

export const getMatches = async (name: string, tag: string, region = 'ap') => {
	const response = await api.get(`/v3/matches/${region}/${name}/${tag}`);
	return response.data;
};
