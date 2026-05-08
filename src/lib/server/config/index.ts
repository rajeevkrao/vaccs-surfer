import axios from 'axios';

import { APIKEY } from '$env/static/private';

export let remainingCount: number;
export let resetTime: Date;
// TODO: update resetTime date from interceptor

const api = axios.create({
	baseURL: 'https://api.henrikdev.xyz/valorant/',
	headers: {
		'Content-Type': 'application/json',
		Authorization: APIKEY
	}
});

api.interceptors.response.use(
	(response) => {
		const remaining = response.headers['x-ratelimit-remaining'];

		if (remaining !== undefined) {
			remainingCount = Number(remaining);
			/* console.log('Rate limit remaining:', rateLimitRemaining); */
		}

		return response;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export { api };
