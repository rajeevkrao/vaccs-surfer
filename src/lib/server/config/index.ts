import axios from 'axios';

import { APIKEY } from '$env/static/private';

const api = axios.create({
	baseURL: 'https://api.henrikdev.xyz/valorant/',
	headers: {
		'Content-Type': 'application/json',
		Authorization: APIKEY
	}
});

export { api };
