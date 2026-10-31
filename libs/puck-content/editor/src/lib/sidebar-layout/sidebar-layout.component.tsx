import { Global } from '@emotion/react';
import { useMediaQuery } from '@mui/material';
import { createUsePuck } from '@puckeditor/core';
import {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  CompactSidebars,
  compactSidebarQuery,
  nextCompactSidebars,
} from './sidebar-layout.helpers';
import { sidebarLayoutStyles } from './sidebar-layout.styles';

const usePuck = createUsePuck();

export const SidebarLayout = ({ children }: PropsWithChildren) => {
  const compact = useMediaQuery(compactSidebarQuery, { noSsr: true });
  const dispatch = usePuck(puck => puck.dispatch);
  const left = usePuck(puck => puck.appState.ui.leftSideBarVisible);
  const right = usePuck(puck => puck.appState.ui.rightSideBarVisible);
  const previous = useRef<CompactSidebars>({
    left,
    right,
    restoreRight: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) {
      return;
    }

    if (!compact) {
      previous.current = { left, right, restoreRight: false };

      return;
    }

    const next = nextCompactSidebars(previous.current, { left, right });

    previous.current = next;

    if (next.left !== left || next.right !== right) {
      dispatch({
        type: 'setUi',
        ui: { leftSideBarVisible: next.left, rightSideBarVisible: next.right },
      });
    }
  }, [mounted, compact, left, right, dispatch]);

  return (
    <>
      <Global styles={sidebarLayoutStyles} />
      {children}
    </>
  );
};
