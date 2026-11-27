export const IntendedRouteStorageKey = 'auth.intended';
export const IntendedRouteExpiryInSeconds = 5 * 60;

export const SENSITIVE_QUERY_PARAMS = [
  'jwt',
  'token',
  'confirmEmailChange',
  'code',
  'loginCode',
];

export const sanitizeIntendedRoute = (asPath: string): string => {
  const url = new URL(asPath, 'http://localhost');

  for (const param of SENSITIVE_QUERY_PARAMS) {
    url.searchParams.delete(param);
  }

  return `${url.pathname}${url.search}${url.hash}`;
};
