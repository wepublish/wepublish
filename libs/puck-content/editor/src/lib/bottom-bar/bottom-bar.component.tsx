import { Tooltip, useMediaQuery } from '@mui/material';
import { createUsePuck, Plugin } from '@puckeditor/core';
import {
  createElement,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useEffect,
  useState,
  PropsWithChildren,
} from 'react';
import { useTranslation } from 'react-i18next';
import { LuPanelLeft, LuPanelRight } from 'react-icons/lu';
import { MdClose } from 'react-icons/md';

import { PUCK_MOBILE_LAYOUT_WIDTH } from '../sidebar-layout/sidebar-layout.helpers';
import {
  BottomBarButton,
  BottomBarCloseButton,
  BottomBarIconButton,
  BottomBarNav,
  BottomBarPanel,
  BottomBarPanelBody,
  BottomBarResizeHandle,
  BottomBarRoot,
  BottomBarSideBarToggles,
} from './bottom-bar.styles';

export type BottomBarItem = Pick<Plugin, 'name' | 'label' | 'icon' | 'render'>;

const keyOf = (item: BottomBarItem) => item.name ?? item.label ?? '';

const MIN_PANEL_HEIGHT = 120;
const DEFAULT_PANEL_HEIGHT = 320;
const PHONE_PANEL_SHARE = 0.4;

const initialPanelHeight = (phone: boolean) =>
  phone ?
    Math.max(
      MIN_PANEL_HEIGHT,
      Math.round(window.innerHeight * PHONE_PANEL_SHARE)
    )
  : DEFAULT_PANEL_HEIGHT;

const usePuck = createUsePuck();

type SideBarToggleProps = {
  label: string;
  icon: ReactNode;
  pressed: boolean;
  onToggle: () => void;
};

function SideBarToggle({ label, icon, pressed, onToggle }: SideBarToggleProps) {
  return (
    <Tooltip
      title={label}
      placement="top"
    >
      <BottomBarIconButton
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onToggle}
      >
        {icon}
      </BottomBarIconButton>
    </Tooltip>
  );
}

function SideBarToggles() {
  const { t } = useTranslation();
  const dispatch = usePuck(puck => puck.dispatch);
  const leftSideBarVisible = usePuck(
    puck => puck.appState.ui.leftSideBarVisible
  );
  const rightSideBarVisible = usePuck(
    puck => puck.appState.ui.rightSideBarVisible
  );

  return (
    <BottomBarSideBarToggles
      role="group"
      aria-label={t('', 'Sidebars')}
    >
      <SideBarToggle
        label={t('', 'Left sidebar')}
        icon={<LuPanelLeft />}
        pressed={leftSideBarVisible}
        onToggle={() =>
          dispatch({
            type: 'setUi',
            ui: { leftSideBarVisible: !leftSideBarVisible },
          })
        }
      />
      <SideBarToggle
        label={t('', 'Right sidebar')}
        icon={<LuPanelRight />}
        pressed={rightSideBarVisible}
        onToggle={() =>
          dispatch({
            type: 'setUi',
            ui: { rightSideBarVisible: !rightSideBarVisible },
          })
        }
      />
    </BottomBarSideBarToggles>
  );
}

export const BottomBarLayout = ({
  items,
  children,
}: PropsWithChildren<{
  items: BottomBarItem[];
}>) => {
  const { t } = useTranslation();
  const phone = useMediaQuery(
    `(max-width: ${PUCK_MOBILE_LAYOUT_WIDTH - 0.02}px)`,
    { noSsr: true }
  );
  const dispatch = usePuck(puck => puck.dispatch);
  const puckPanelOpen = usePuck(puck => puck.appState.ui.leftSideBarVisible);
  const [openName, setOpenName] = useState<string>();
  const [height, setHeight] = useState(() => initialPanelHeight(phone));
  const [wasPuckPanelOpen, setWasPuckPanelOpen] = useState(puckPanelOpen);
  const open = items.find(item => keyOf(item) === openName && item.render);

  if (puckPanelOpen !== wasPuckPanelOpen) {
    setWasPuckPanelOpen(puckPanelOpen);

    if (puckPanelOpen && phone) {
      setOpenName(undefined);
    }
  }

  const toggle = (name: string) => {
    const next = name === openName ? undefined : name;

    setOpenName(next);

    if (next && phone && puckPanelOpen) {
      dispatch({ type: 'setUi', ui: { leftSideBarVisible: false } });
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenName(undefined);
      }
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startY = event.clientY;
    const startHeight = height;

    const resize = (move: PointerEvent) =>
      setHeight(
        Math.max(MIN_PANEL_HEIGHT, startHeight + startY - move.clientY)
      );
    const stop = () => {
      window.removeEventListener('pointermove', resize);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', resize);
    window.addEventListener('pointerup', stop);
  };

  return (
    <BottomBarRoot>
      {children}

      {open && (
        <BottomBarPanel
          aria-label={open.label ?? keyOf(open)}
          style={{ height }}
        >
          <BottomBarResizeHandle onPointerDown={startResize} />

          <BottomBarCloseButton
            type="button"
            aria-label={t('', 'Close panel')}
            onClick={() => setOpenName(undefined)}
          >
            <MdClose size={16} />
          </BottomBarCloseButton>

          <BottomBarPanelBody>
            {open.render && createElement(open.render)}
          </BottomBarPanelBody>
        </BottomBarPanel>
      )}

      <BottomBarNav>
        {items.map(item => (
          <BottomBarButton
            key={keyOf(item)}
            type="button"
            aria-pressed={keyOf(item) === openName}
            onClick={() => toggle(keyOf(item))}
          >
            {item.icon}
            {item.label ?? keyOf(item)}
          </BottomBarButton>
        ))}

        <SideBarToggles />
      </BottomBarNav>
    </BottomBarRoot>
  );
};
