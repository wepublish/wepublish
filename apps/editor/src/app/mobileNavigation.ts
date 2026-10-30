import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useMobileNavigation() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen(current => !current), []);
  const close = useCallback(() => setOpen(false), []);

  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return { open, toggle, close };
}
