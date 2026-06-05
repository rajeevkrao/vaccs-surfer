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

export interface IndexedDBChangeEvent {
	operation: 'add' | 'put' | 'delete' | 'clear';
	storeName: string;
	key?: any;
	value?: any;
	timestamp: number;
}

if (typeof window !== 'undefined' && typeof IDBObjectStore !== 'undefined') {
	const originalAdd = IDBObjectStore.prototype.add;
	const originalPut = IDBObjectStore.prototype.put;
	const originalDelete = IDBObjectStore.prototype.delete;
	const originalClear = IDBObjectStore.prototype.clear;

	const broadcastChange = (event: IndexedDBChangeEvent) => {
		try {
			const channel = new BroadcastChannel('indexeddb-update');
			channel.postMessage(event);
			channel.close();
		} catch (e) {
			console.error('Failed to broadcast IndexedDB change:', e);
		}
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('indexeddb-change-local', { detail: event }));
		}
	};

	IDBObjectStore.prototype.add = function (value, key) {
		const request = originalAdd.apply(this, arguments as any);
		const storeName = this.name;
		request.addEventListener('success', () => {
			const resolvedKey = key !== undefined ? key : request.result;
			broadcastChange({
				operation: 'add',
				storeName,
				key: resolvedKey,
				value,
				timestamp: Date.now()
			});
		});
		return request;
	};

	IDBObjectStore.prototype.put = function (value, key) {
		const request = originalPut.apply(this, arguments as any);
		const storeName = this.name;
		request.addEventListener('success', () => {
			const resolvedKey = key !== undefined ? key : request.result;
			broadcastChange({
				operation: 'put',
				storeName,
				key: resolvedKey,
				value,
				timestamp: Date.now()
			});
		});
		return request;
	};

	IDBObjectStore.prototype.delete = function (key) {
		const request = originalDelete.apply(this, arguments as any);
		const storeName = this.name;
		request.addEventListener('success', () => {
			broadcastChange({
				operation: 'delete',
				storeName,
				key,
				timestamp: Date.now()
			});
		});
		return request;
	};

	IDBObjectStore.prototype.clear = function () {
		const request = originalClear.apply(this, arguments as any);
		const storeName = this.name;
		request.addEventListener('success', () => {
			broadcastChange({
				operation: 'clear',
				storeName,
				timestamp: Date.now()
			});
		});
		return request;
	};
}

export function onIndexedDBChange(callback: (event: IndexedDBChangeEvent) => void): () => void {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const channel = new BroadcastChannel('indexeddb-update');

	const handleMessage = (event: MessageEvent) => {
		callback(event.data);
	};

	const handleLocal = (event: Event) => {
		const customEvent = event as CustomEvent<IndexedDBChangeEvent>;
		callback(customEvent.detail);
	};

	channel.addEventListener('message', handleMessage);
	window.addEventListener('indexeddb-change-local', handleLocal);

	return () => {
		channel.removeEventListener('message', handleMessage);
		channel.close();
		window.removeEventListener('indexeddb-change-local', handleLocal);
	};
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
