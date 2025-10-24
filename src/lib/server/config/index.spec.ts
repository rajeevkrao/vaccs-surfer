import { describe, it, expect } from 'vitest';

import { api } from './index';
const testAccount = {
	name: 'rkrao',
	tag: 'rkrao',
	region: 'ap'
};

describe('api test', () => {
	it('should send a request to the valorant api', async () => {
		const response = await api.get(`/v1/account/${testAccount.name}/${testAccount.tag}`);
		expect(response.status).toBe(200);
		/* try {
			
		} catch (error) {
			console.error(error);
		} */
	});
});
