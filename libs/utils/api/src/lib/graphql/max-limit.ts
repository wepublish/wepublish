const MaxResultsPerPage = 100;

export const getMaxTake = (take: number) => Math.min(take, MaxResultsPerPage);
