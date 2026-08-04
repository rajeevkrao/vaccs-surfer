export const getClusterCount = (matchesData: any) => {
	let clusterCount: any = {};
	matchesData.forEach((match: any) => {
		clusterCount[match.meta.cluster] = (clusterCount[match.meta.cluster] || 0) + 1;
	});
	return clusterCount;
};

export const getTotalMatches = (matchesdata: any) => {
	// TODO: This is not including missing matches so implement for missing matches as well
	return matchesdata.length;
};

export const getHsPercentage = (matchesdata: any) => {
	const totalShots = matchesdata.reduce((acc: number, match: any) => {
		const head = Number(match?.stats?.shots?.head) || 0;
		const body = Number(match?.stats?.shots?.body) || 0;
		const legs = Number(match?.stats?.shots?.leg) || 0;

		return acc + head + body + legs;
	}, 0);

	const headShots = matchesdata.reduce((acc: number, match: any) => {
		const head = Number(match?.stats?.shots?.head) || 0;
		return acc + head;
	}, 0);

	const hsPercentage = totalShots > 0 ? (headShots / totalShots) * 100 : 0;
	return hsPercentage.toFixed(2);
};

export const logNameTagPuuidForCsv = (accountData: any) => {
	console.log(`${accountData.name},${accountData.tag},${accountData.puuid},`);
};
