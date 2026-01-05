import axios from 'axios';

import { APIKEY } from '$env/static/private';

const api = axios.create({
	baseURL: 'https://api.henrikdev.xyz/valorant/',
	headers: {
		'Content-Type': 'application/json',
		Authorization: APIKEY
	}
});

// Response interceptor - logs specific header for EVERY response
api.interceptors.response.use(
	(response) => {
		const remaining = response.headers['x-ratelimit-remaining'];
		const time = response.headers['x-ratelimit-reset'];
		console.log('Rate Limit Remaining:', remaining, 'in', time, 'seconds'); // Replace with your header
		// Or any header: response.headers['content-type']
		return response;
	},
	(error) => {
		// Handle errors if needed
		return Promise.reject(error);
	}
);

export { api };
