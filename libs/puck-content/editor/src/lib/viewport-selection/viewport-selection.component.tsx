import { PropsWithChildren, useEffect } from 'react';

/**
 * Keeps the selected component selected when the viewport is switched via the
 * canvas controls, which puck otherwise treats as a click outside.
 */
export const ViewportSelection = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;

      if (!target?.closest('[class*="PuckCanvas-controls"]')) {
        return;
      }

      target.setAttribute('data-puck-dropzone', '');

      setTimeout(() => target.removeAttribute('data-puck-dropzone'));
    };

    document.addEventListener('click', onClick, true);

    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Puck's override has to return an element, not a bare node
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};
