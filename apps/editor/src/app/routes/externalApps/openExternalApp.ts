import { externalAppSrc } from './useExternalAppSrc';

/**
 * Opens an app in a new tab with a freshly minted token. The tab is opened
 * inside the click, which is what popup blockers look at, and pointed at the
 * app once the token is there. `opener` is cleared by hand: asking
 * `window.open` for `noopener` makes it return null instead of the tab.
 */
export async function openExternalApp(
  url: string,
  mintToken: () => Promise<string>
): Promise<void> {
  const popup = window.open('', '_blank');

  if (!popup) {
    return;
  }

  popup.opener = null;

  try {
    popup.location.replace(externalAppSrc(url, await mintToken()));
  } catch (error) {
    popup.close();
    throw error;
  }
}
