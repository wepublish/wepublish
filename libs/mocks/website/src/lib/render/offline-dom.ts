import type { BrowserWindow, IBrowserSettings } from 'happy-dom';

type HappyDOMWindow = Window & {
  happyDOM?: { settings: IBrowserSettings };
};

const isChildFrame = (window: BrowserWindow) => window.parent !== window;

const happyDOMSettings = () =>
  typeof window === 'undefined' ? undefined : (
    (window as HappyDOMWindow).happyDOM?.settings
  );

export const preventDomNetworkAccess = () => {
  const settings = happyDOMSettings();

  if (!settings) {
    return;
  }

  settings.disableJavaScriptFileLoading = true;
  settings.disableCSSFileLoading = true;
  settings.handleDisabledFileLoadingAsSuccess = true;
  settings.fetch.interceptor = {
    beforeAsyncRequest: async ({ window }) => {
      if (isChildFrame(window)) {
        return new window.Response('', {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    },
  };
};
