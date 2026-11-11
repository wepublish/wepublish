import { useLayoutEffect, useSyncExternalStore } from 'react';

export type PageShellFlags = {
  hideHeader?: boolean | null;
  hideFooter?: boolean | null;
};

type Report = { flags: PageShellFlags };

let current: Report | undefined;
const listeners = new Set<() => void>();

const publish = (next: Report | undefined) => {
  current = next;
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => current?.flags;
const getServerSnapshot = () => undefined;

export const usePageShell = (): PageShellFlags | undefined =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const useReportPageShell = (page: PageShellFlags | null | undefined) => {
  const hideHeader = page ? !!page.hideHeader : undefined;
  const hideFooter = page ? !!page.hideFooter : undefined;

  useLayoutEffect(() => {
    if (hideHeader === undefined || hideFooter === undefined) {
      return;
    }

    const report: Report = { flags: { hideHeader, hideFooter } };
    publish(report);

    return () => {
      if (current === report) {
        publish(undefined);
      }
    };
  }, [hideHeader, hideFooter]);
};
