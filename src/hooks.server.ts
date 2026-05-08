export async function handle({ event, resolve }) {
	if (event.url.pathname.startsWith('/.well-known')) {
		return new Response(null, { status: 204 }); // no content
	}

	return resolve(event);
}
