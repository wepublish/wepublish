export const BANNER_STORAGE_KEY = `banner-last-closed`;

export const collapseBanner = () => {
  localStorage.setItem(BANNER_STORAGE_KEY, new Date().getTime().toString());
};
