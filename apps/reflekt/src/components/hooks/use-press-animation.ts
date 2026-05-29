import { useRouter } from 'next/router';
import { MouseEvent, useCallback, useRef, useState } from 'react';

export const PRESS_DURATION_MS = 220;

export function usePressAnimation(href?: string) {
  const router = useRouter();
  const [isPressing, setIsPressing] = useState(false);
  const navigationLockRef = useRef(false);

  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      if (navigationLockRef.current) {
        event.preventDefault();
        return;
      }

      const isInternal = !!href && !/^https?:\/\//.test(href);
      const isModified =
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

      if (isInternal && !isModified) {
        event.preventDefault();
        navigationLockRef.current = true;
        setIsPressing(true);
        window.setTimeout(() => {
          setIsPressing(false);
          router.push(href!).finally(() => {
            navigationLockRef.current = false;
          });
        }, PRESS_DURATION_MS);
        return;
      }

      setIsPressing(true);
      window.setTimeout(() => setIsPressing(false), PRESS_DURATION_MS);
    },
    [href, router]
  );

  return { isPressing, onClick };
}
