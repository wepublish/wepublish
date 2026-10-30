import styled from '@emotion/styled';
import { Plugin } from '@puckeditor/core';
import {
  createElement,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';

export type BottomBarItem = Pick<Plugin, 'name' | 'label' | 'icon' | 'render'>;

const keyOf = (item: BottomBarItem) => item.name ?? item.label ?? '';

const MIN_PANEL_HEIGHT = 120;
const DEFAULT_PANEL_HEIGHT = 320;

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 0;

  & > :first-child {
    flex: 1;
    min-height: 0;
    height: auto !important;
  }
`;

const Panel = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-height: 80%;
  border-top: 1px solid var(--puck-color-border);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
`;

const ResizeHandle = styled.div`
  position: absolute;
  inset: -3px 0 auto;
  height: 6px;
  cursor: ns-resize;
  z-index: 1;

  &:hover {
    background: var(--puck-color-interactive);
  }
`;

const PanelBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

const Bar = styled.nav`
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  height: 26px;
  padding: 0 8px;
  border-top: 1px solid var(--puck-color-border);
  background: var(--puck-color-surface);
`;

const BarButton = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border: 0;
  background: ${({ active }) =>
    active ? 'var(--puck-color-interactive-soft)' : 'transparent'};
  color: ${({ active }) =>
    active ?
      'var(--puck-color-interactive)'
    : 'var(--puck-color-text-secondary)'};
  font: inherit;
  font-size: var(--puck-font-size-xxs);
  cursor: pointer;

  &:hover {
    color: var(--puck-color-text);
    background: var(--puck-color-interactive-soft);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: inline-flex;
  padding: 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--puck-color-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--puck-color-text);
    background: var(--puck-color-interactive-soft);
  }
`;

export const BottomBarLayout = ({
  items,
  children,
}: {
  items: BottomBarItem[];
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  const [openName, setOpenName] = useState<string>();
  const [height, setHeight] = useState(DEFAULT_PANEL_HEIGHT);
  const open = items.find(item => keyOf(item) === openName && item.render);

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
    <Layout>
      {children}

      {open && (
        <Panel
          aria-label={open.label ?? keyOf(open)}
          style={{ height }}
        >
          <ResizeHandle onPointerDown={startResize} />

          <CloseButton
            type="button"
            aria-label={t('', 'Close panel')}
            onClick={() => setOpenName(undefined)}
          >
            <MdClose size={16} />
          </CloseButton>

          <PanelBody>{open.render && createElement(open.render)}</PanelBody>
        </Panel>
      )}

      <Bar>
        {items.map(item => (
          <BarButton
            key={keyOf(item)}
            type="button"
            active={keyOf(item) === openName}
            aria-pressed={keyOf(item) === openName}
            onClick={() =>
              setOpenName(current =>
                current === keyOf(item) ? undefined : keyOf(item)
              )
            }
          >
            {item.icon}
            {item.label ?? keyOf(item)}
          </BarButton>
        ))}
      </Bar>
    </Layout>
  );
};
