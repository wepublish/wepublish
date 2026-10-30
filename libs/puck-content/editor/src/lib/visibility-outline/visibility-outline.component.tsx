import styled from '@emotion/styled';
import { createUsePuck } from '@puckeditor/core';
import { ReactNode, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { MdSchedule, MdVisibilityOff } from 'react-icons/md';

import {
  collectBlockVisibility,
  outlineBadges,
  outlineNameSelector,
  outlineVisibilityCss,
} from './visibility-outline.helpers';

const usePuck = createUsePuck();

const OutlineBadges = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  vertical-align: middle;
  color: var(--puck-color-text-secondary);

  span {
    min-width: 18px;
    padding: 1px 5px;
    border-radius: 4px;
    background-color: var(--puck-color-border);
    font-family: inherit;
    font-size: 0.6875rem;
    line-height: 1.5;
    text-align: center;
  }
`;

const BADGE_HOST = 'data-outline-visibility';

const useOutlineHosts = (root: HTMLElement | null, ids: string[]) => {
  const [hosts, setHosts] = useState<Record<string, HTMLElement>>({});
  const idsKey = ids.join('\n');

  useLayoutEffect(() => {
    if (!root) {
      return;
    }

    const sync = () => {
      const next: Record<string, HTMLElement> = {};

      for (const id of idsKey ? idsKey.split('\n') : []) {
        const name = root.querySelector(outlineNameSelector(id));

        if (!name) {
          continue;
        }

        let host = name.querySelector<HTMLElement>(`:scope > [${BADGE_HOST}]`);

        if (!host) {
          host = document.createElement('span');
          host.setAttribute(BADGE_HOST, '');
          name.appendChild(host);
        }

        next[id] = host;
      }

      root.querySelectorAll<HTMLElement>(`[${BADGE_HOST}]`).forEach(host => {
        if (!Object.values(next).includes(host)) {
          host.remove();
        }
      });

      setHosts(previous =>
        (
          Object.keys(previous).length === Object.keys(next).length &&
          Object.entries(next).every(([id, host]) => previous[id] === host)
        ) ?
          previous
        : next
      );
    };

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [root, idsKey]);

  return hosts;
};

export const VisibilityOutline = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const data = usePuck(puck => puck.appState.data);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  const entries = useMemo(
    () => collectBlockVisibility([data.content, data.zones]),
    [data]
  );
  const hosts = useOutlineHosts(
    root,
    entries.map(({ id }) => id)
  );

  return (
    <div
      ref={setRoot}
      style={{ display: 'contents' }}
    >
      {children}
      <style>{outlineVisibilityCss(entries)}</style>

      {entries.map(({ id, value }) => {
        const host = hosts[id];

        if (!host) {
          return null;
        }

        const { disabled, timed, breakpoints } = outlineBadges(value);

        return createPortal(
          <OutlineBadges>
            {disabled && (
              <MdVisibilityOff
                size={14}
                title={t('', 'Disabled')}
              />
            )}
            {timed && (
              <MdSchedule
                size={14}
                title={t('', 'Timed')}
              />
            )}
            {breakpoints.map(breakpoint => (
              <span key={breakpoint}>{breakpoint}</span>
            ))}
          </OutlineBadges>,
          host,
          id
        );
      })}
    </div>
  );
};
