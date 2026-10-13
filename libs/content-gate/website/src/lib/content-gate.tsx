import styled from '@emotion/styled';
import { css, GlobalStyles } from '@mui/material';
import {
  useSetIntendedRoute,
  useUser,
} from '@wepublish/authentication/website';
import { ContentGateAudience } from '@wepublish/website/api';
import {
  BuilderContentGateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ContentGateWrapper = styled.div`
  display: grid !important; // exception as it should always be shown
  gap: ${({ theme }) => theme.spacing(5)};
  background-color: ${({ theme }) => theme.palette.accent.light};
  color: ${({ theme }) => theme.palette.accent.contrastText};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const ContentGateActions = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: ${({ theme }) => theme.spacing(3)};
  row-gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: max-content max-content;
  }
`;

// Duplicated to avoid circular dependency
const forceHideBanner = (
  <GlobalStyles
    styles={css`
      [data-banner] {
        display: none !important;
      }
    `}
  />
);

export const ContentGate = ({
  className,
  state,
  audience,
  softDescription,
  hardDescription,
  ctaLabel,
  ctaUrl,
  texts,
}: BuilderContentGateProps) => {
  const { t } = useTranslation();
  const { hasUser } = useUser();
  const [dismissed, setDismissed] = useState(false);
  const {
    elements: { Button, Link, Modal },
    blocks: { RichText },
  } = useWebsiteBuilder();
  const setIntendedRoute = useSetIntendedRoute();

  const forNonSubscribers = audience === ContentGateAudience.NonSubscribers;
  const href = ctaUrl || (forNonSubscribers ? '/mitmachen' : '/signup');
  const label =
    texts?.cta ??
    ctaLabel ??
    t(forNonSubscribers ? 'contentGate.subscribe' : 'contentGate.register');

  if (state === 'soft') {
    return (
      <Modal
        className={className}
        open={!dismissed}
        submitText={label}
        cancelText={texts?.continueReading ?? t('contentGate.continueReading')}
        onCancel={() => setDismissed(true)}
        onSubmit={() => {
          setIntendedRoute();
          window.location.assign(href);
        }}
      >
        <RichText richText={softDescription} />
      </Modal>
    );
  }

  return (
    <ContentGateWrapper className={className}>
      <RichText richText={hardDescription} />

      <ContentGateActions>
        <Button
          variant="contained"
          color="secondary"
          LinkComponent={Link}
          href={href}
          onClick={setIntendedRoute}
        >
          {label}
        </Button>

        {!hasUser && (
          <Button
            variant="outlined"
            color="secondary"
            LinkComponent={Link}
            href={'/login'}
            onClick={setIntendedRoute}
          >
            {texts?.login ?? t('contentGate.login')}
          </Button>
        )}
      </ContentGateActions>

      {forceHideBanner}
    </ContentGateWrapper>
  );
};
