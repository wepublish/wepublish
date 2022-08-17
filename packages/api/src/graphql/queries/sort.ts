export type SortOrder = 'asc' | 'desc'

export const getSortOrder = (order: -1 | 1) => (order === 1 ? 'asc' : 'desc')
