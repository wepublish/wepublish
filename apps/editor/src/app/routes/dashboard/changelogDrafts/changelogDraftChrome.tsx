import styled from '@emotion/styled';
import { IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ComponentProps, ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ChangelogBell } from './changelogBell';
import { CHANGELOG_DRAFTS, useChangelogDraft } from './changelogDraft';
import { ChangelogRequiredBars } from './changelogRequiredBars';
import {
  WhatsNewButton,
  WhatsNewProvider,
  WhatsNewRequiredBanner,
} from './whatsNew';

/**
 * Where each draft hooks into the editor shell and the dashboard toolbar.
 * Everything here goes away together with the drafts that lose.
 */

/** Hosts the "What's new" panel while draft 3 is active. */
export function ChangelogDraftProvider({ children }: { children: ReactNode }) {
  const [draft] = useChangelogDraft();

  return draft === 3 ?
      <WhatsNewProvider>{children}</WhatsNewProvider>
    : children;
}

/** Above the page content: required actions as bars (2) or a banner (3). */
export function ChangelogDraftTopBar() {
  const [draft] = useChangelogDraft();

  if (draft === 2) {
    return <ChangelogRequiredBars />;
  }

  if (draft === 3) {
    return <WhatsNewRequiredBanner />;
  }

  return null;
}

/** In the sidebar footer: the "What's new" entry point of draft 3. */
export function ChangelogDraftSidebarButton({
  ButtonComponent,
}: {
  ButtonComponent?: ComponentType<ComponentProps<typeof IconButton>>;
}) {
  const [draft] = useChangelogDraft();

  return draft === 3 ?
      <WhatsNewButton ButtonComponent={ButtonComponent} />
    : null;
}

/** In the dashboard toolbar: the bell of draft 2. */
export function ChangelogDraftToolbarButton() {
  const [draft] = useChangelogDraft();

  return draft === 2 ? <ChangelogBell /> : null;
}

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-right: auto;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

/** Temporary: flips between the drafts on this branch. */
export function ChangelogDraftSwitch() {
  const { t } = useTranslation();
  const [draft, setDraft] = useChangelogDraft();

  return (
    <SwitchWrapper>
      <span id="changelog-draft-label">{t('changelog.draft')}</span>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={draft}
        aria-labelledby="changelog-draft-label"
        onChange={(_, value) => value && setDraft(value)}
      >
        {CHANGELOG_DRAFTS.map(value => (
          <ToggleButton
            key={value}
            value={value}
            sx={{ px: 1.5, py: 0.25 }}
          >
            {value}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </SwitchWrapper>
  );
}
