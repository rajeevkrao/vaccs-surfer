// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			retrySeconds?: number;
		}
		// interface Error {}
		interface Locals {
			/** UUID assigned to this browser session via cookie */
			sessionId: string;
			/** Total number of page visits recorded in Redis for this session */
			sessionVisits: number;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
