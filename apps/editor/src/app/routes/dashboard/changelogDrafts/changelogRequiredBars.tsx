import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import {
  ChangelogEntriesDocument,
  ChangelogSeverity,
} from '@wepublish/editor/api';
import { useHasPermission } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdErrorOutline } from 'react-icons/md';
import { useLocation } from 'react-router-dom';

import { CONFIRM_PERMISSION, useChangelogDialogs } from '../changelogDashboard';
import { isContentEditorRoute } from './contentEditorRoute';

/**
 * DRAFT 2 — every open required action as its own bar pinned to the top of
 * the page, like a second navigation bar, until somebody marks it as done.
 * Everyone sees them (they explain why something may not work); only people
 * who may sign the action off get the button. The content editors are left
 * alone.
 */
const Bars = styled.div`
  position: sticky;
  /* Flush with the edges of the padded, scrolling main area. */
  flex-shrink: 0;
  top: calc(-1 * var(--wep-page-padding-y, 0px));
  margin: calc(-1 * var(--wep-page-padding-y, 0px))
    calc(-1 * var(--wep-page-padding-x, 0px)) var(--wep-page-padding-y, 0px);
  z-index: ${({ theme }) => theme.zIndex.appBar};
  display: flex;
  flex-direction: column;
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing(0.5, 2)};
  background: ${({ theme }) => theme.vars.palette.error.main};
  color: ${({ theme }) => theme.vars.palette.error.contrastText};
  font-size: 0.875rem;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.25);
  }

  > svg {
    flex-shrink: 0;
    font-size: 20px;
  }
`;

const Text = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function ChangelogRequiredBars() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const mayConfirm = useHasPermission(CONFIRM_PERMISSION);
  const { overlay, showDetails, confirm } = useChangelogDialogs();
  const hidden = isContentEditorRoute(pathname);

  const { data } = useQuery(ChangelogEntriesDocument, {
    fetchPolicy: 'cache-and-network',
    skip: hidden,
    variables: {
      take: 20,
      filter: { severities: [ChangelogSeverity.Required], confirmed: false },
      locale: i18n.language,
    },
  });

  const entries = hidden ? [] : (data?.changelogEntries.nodes ?? []);

  if (!entries.length) {
    return overlay;
  }

  return (
    <>
      <Bars
        role="region"
        aria-label={t('changelog.severity.required')}
      >
        {entries.map(entry => (
          <Bar
            key={entry.id}
            data-testid="changelog-required-bar"
          >
            <MdErrorOutline aria-hidden />

            <Text title={`${entry.title} — ${entry.lead}`}>
              <strong>{entry.title}</strong> — {entry.lead}
            </Text>

            <Button
              size="small"
              color="inherit"
              onClick={() => showDetails(entry)}
            >
              {t('changelog.details')}
            </Button>

            {mayConfirm && (
              <Button
                size="small"
                color="inherit"
                variant="outlined"
                onClick={() => confirm(entry)}
              >
                {t('notifications.markAsDone')}
              </Button>
            )}
          </Bar>
        ))}
      </Bars>

      {overlay}
    </>
  );
}
