const DB_NAME = 'vaccs-surfer';
const DB_VERSION = 1;
const STORE_NAME = 'recentAccounts';

export interface RecentAccount {
	name: string;
	tag: string;
	puuid: string;
	visitedAt: number;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'puuid' });
				store.createIndex('visitedAt', 'visitedAt', { unique: false });
			}
		};
	});
}

export async function addRecentAccount(account: {
	name: string;
	tag: string;
	puuid: string;
}): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		const record: RecentAccount = {
			name: account.name,
			tag: account.tag,
			puuid: account.puuid,
			visitedAt: Date.now()
		};

		const request = store.put(record);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getRecentAccounts(limit = 500): Promise<RecentAccount[]> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const index = store.index('visitedAt');

		const records: RecentAccount[] = [];
		const request = index.openCursor(null, 'prev');

		request.onerror = () => reject(request.error);
		request.onsuccess = (event) => {
			const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
			if (cursor && records.length < limit) {
				records.push(cursor.value);
				cursor.continue();
			} else {
				resolve(records);
			}
		};
	});
}

export async function searchRecentAccounts(query: string): Promise<RecentAccount[]> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const index = store.index('visitedAt');

		const records: RecentAccount[] = [];
		const lowerQuery = query.toLowerCase();
		const request = index.openCursor(null, 'prev');

		request.onerror = () => reject(request.error);
		request.onsuccess = (event) => {
			const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
			if (cursor) {
				const account = cursor.value;
				if (
					account.name.toLowerCase().includes(lowerQuery) ||
					`${account.name}#${account.tag}`.toLowerCase().includes(lowerQuery)
				) {
					records.push(account);
				}
				cursor.continue();
			} else {
				resolve(records);
			}
		};
	});
}
