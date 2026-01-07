import { useRouter } from 'next/router';
import { ComponentType, memo, useEffect } from 'react';

const storageKey = 'is-first-route';

export const withTrackFirstRoute = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object,
>(
  ControlledComponent: ComponentType<P>
) =>
  // eslint-disable-next-line react/display-name
  memo<P>(props => {
    const router = useRouter();

    useEffect(() => {
      // @TODO: track also initial page not page with property??
      // sessionStorage.setItem(storageKey, `1`);
      // wait for user to be loaded

      const handleRouteChange = () => {
        sessionStorage.setItem(storageKey, `1`);
      };

      router.events.on('routeChangeComplete', handleRouteChange);

      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }, [router]);

    return <ControlledComponent {...(props as P)} />;
  });

export const useIsFirstRoute = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const isFirstRoute = !parseInt(sessionStorage.getItem(storageKey) ?? '0');

  return isFirstRoute;
};
