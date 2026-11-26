export const loginRedirectUrl = ({
  pathname,
  search,
}: Pick<Location, 'pathname' | 'search'>) =>
  `/login?next=${encodeURIComponent(pathname + search)}`;
