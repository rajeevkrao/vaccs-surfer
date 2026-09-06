import type { Handle } from '@sveltejs/kit';
import { getRedisClient } from '$lib/server/redis';
import { randomUUID } from 'crypto';

/** How long a session cookie lives (7 days in seconds) */
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Redis key prefix for session visit counters */
const SESSION_KEY_PREFIX = 'session:visits:';

/**
 * Fire-and-forget: increments the Redis visit counter for this session
 * without blocking the response. Errors are swallowed so Redis issues
 * never affect the user.
 */
function trackVisitAsync(sessionId: string, isNewSession: boolean): Promise<void> {
	const redis = getRedisClient();
	const redisKey = `${SESSION_KEY_PREFIX}${sessionId}`;

	// Pipeline INCR + EXPIRE in a single round-trip — return the promise for waitUntil()
	return redis
		.pipeline()
		.incr(redisKey)
		.expire(redisKey, SESSION_TTL_SECONDS)
		.exec()
		.then(([[incrErr, visits]]) => {
			if (incrErr) throw incrErr;
			const label = isNewSession ? 'NEW ' : 'CONT';
			console.log(`[Session] ${label} sessionId=${sessionId}  visits=${visits}`);
		})
		.catch((err) => {
			console.error('[Session] Redis error:', err);
		});
}

export const handle: Handle = async ({ event, resolve }) => {
	// Skip non-content requests
	if (event.url.pathname.startsWith('/.well-known')) {
		return new Response(null, { status: 204 });
	}

	// ── 1. Resolve / create session ID ───────────────────────────────────────
	let sessionId = event.cookies.get('vaccs_session');
	const isNewSession = !sessionId;

	if (isNewSession) {
		sessionId = randomUUID();
	}

	// ── 2. Set / refresh the session cookie ──────────────────────────────────
	event.cookies.set('vaccs_session', sessionId!, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: SESSION_TTL_SECONDS
	});

	// Expose session ID to load functions via event.locals
	event.locals.sessionId = sessionId!;
	event.locals.sessionVisits = 0; // not awaited; read from Redis separately if needed

	// ── 3. Kick off Redis tracking — non-blocking, Vercel-safe ─────────────
	const trackingPromise = trackVisitAsync(sessionId!, isNewSession);

	// On Vercel (serverless), the process is frozen once the response is sent,
	// so un-awaited promises get killed. waitUntil() tells Vercel to keep the
	// function alive until the Redis write completes without blocking the response.
	// Falls back to fire-and-forget in local dev (process stays running).
	event.platform?.context?.waitUntil(trackingPromise);

	// ── 4. Resolve the request immediately ───────────────────────────────────
	return resolve(event);
};
