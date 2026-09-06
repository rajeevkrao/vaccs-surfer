import Redis from 'ioredis';
import { REDIS_URL } from '$env/static/private';

// Singleton Redis client — reused across all server requests
let _client: Redis | null = null;

export function getRedisClient(): Redis {
	if (!_client) {
		_client = new Redis(REDIS_URL, {
			// Reconnect automatically with exponential back-off
			retryStrategy: (times) => Math.min(times * 100, 3000),
			lazyConnect: false,
			family: 0
		});

		_client.on('error', (err) => {
			console.error('[Redis] connection error:', err.message);
		});
	}
	return _client;
}
