export const createSafeHostUrl = (hostUrl: string, path: string) =>
  new URL(path.replace(/^\/+/, ''), hostUrl.replace(/\/+$/, '')).toString();
