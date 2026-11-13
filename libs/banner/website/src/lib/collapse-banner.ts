import { LEGACY_BANNER_CLOSED_KEY } from '@wepublish/engagement/website';

export const BANNER_STORAGE_KEY = LEGACY_BANNER_CLOSED_KEY;

export const collapseBanner = () => {
  localStorage.setItem(BANNER_STORAGE_KEY, new Date().getTime().toString());
};
