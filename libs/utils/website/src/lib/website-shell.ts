export type WebsiteShell = {
  showNavigation: boolean;
  showFooter: boolean;
};

export type WebsiteShellProps = {
  shell?: Partial<WebsiteShell>;
};

export const getWebsiteShell = (
  pageProps: WebsiteShellProps | undefined
): WebsiteShell => ({
  showNavigation: true,
  showFooter: true,
  ...pageProps?.shell,
});

export const getPageShell = (
  page: { hideHeader?: boolean; hideFooter?: boolean } | null | undefined
): WebsiteShell => ({
  showNavigation: !page?.hideHeader,
  showFooter: !page?.hideFooter,
});
