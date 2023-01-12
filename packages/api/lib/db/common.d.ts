export declare enum SortOrder {
    Ascending = 1,
    Descending = -1
}
export interface PageInfo {
    startCursor: string | null;
    endCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export interface ConnectionResult<T> {
    nodes: T[];
    pageInfo: PageInfo;
    totalCount: number;
}
export declare const DefaultSessionTTL: number;
export declare const DefaultBcryptHashCostFactor = 11;
export declare const MaxResultsPerPage = 100;
export declare enum DateFilterComparison {
    GreaterThan = "gt",
    GreaterThanOrEqual = "gte",
    Equal = "eq",
    LowerThan = "lt",
    LowerThanOrEqual = "lte"
}
export interface DateFilter {
    date: Date | null;
    comparison: DateFilterComparison;
}
//# sourceMappingURL=common.d.ts.map