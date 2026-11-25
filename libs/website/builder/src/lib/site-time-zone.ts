import { formatInTimeZone } from 'date-fns-tz';

// All tenants are in Switzerland/Austria. Formatting in a fixed zone keeps the
// server render (UTC container) and the browser render identical.
export const SITE_TIME_ZONE = 'Europe/Zurich';

export const formatInSiteTimeZone = (
  date: Date,
  formatStr: string,
  options?: Parameters<typeof formatInTimeZone>[3]
) => formatInTimeZone(date, SITE_TIME_ZONE, formatStr, options);

export const isSameDayInSiteTimeZone = (a: Date, b: Date) =>
  formatInSiteTimeZone(a, 'yyyy-MM-dd') ===
  formatInSiteTimeZone(b, 'yyyy-MM-dd');
