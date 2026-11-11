import { PageShellFlags, usePageShell } from '@wepublish/website/builder';

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
  page:
    | { hideHeader?: boolean | null; hideFooter?: boolean | null }
    | null
    | undefined
): WebsiteShell => ({
  showNavigation: !page?.hideHeader,
  showFooter: !page?.hideFooter,
});

export const getLiveWebsiteShell = (
  pageProps: WebsiteShellProps | undefined,
  livePage: PageShellFlags | undefined
): WebsiteShell =>
  pageProps?.shell && livePage ?
    getPageShell(livePage)
  : getWebsiteShell(pageProps);

export const useLiveWebsiteShell = (
  pageProps: WebsiteShellProps | undefined
): WebsiteShell => getLiveWebsiteShell(pageProps, usePageShell());
