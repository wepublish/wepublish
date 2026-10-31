import { Global } from '@emotion/react';
import { PropsWithChildren, useEffect } from 'react';

import { viewportControlsStyles } from './viewport-selection.styles';

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

  return (
    <>
      <Global styles={viewportControlsStyles} />
      {children}
    </>
  );
};
