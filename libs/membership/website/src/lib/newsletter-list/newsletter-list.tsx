import styled from '@emotion/styled';
import { FormControlLabel, Switch } from '@mui/material';
import {
  FullMyNewsletterListFragment,
  NewsletterListUserStatus,
} from '@wepublish/website/api';
import {
  BuilderNewsletterListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const NewsletterListWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const NewsletterListItemWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};

  &[data-locked='true'] {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

export const NewsletterListItemText = styled('p')`
  margin: 0;
  color: ${({ theme }) => theme.palette.text.secondary};

  [data-locked='true'] > & {
    color: ${({ theme }) => theme.palette.text.disabled};
  }
`;

export const NewsletterListItemActions = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

type NewsletterListItemProps = Pick<
  BuilderNewsletterListProps,
  'subscribeUrl' | 'onSubscribe' | 'onUnsubscribe'
> & {
  list: FullMyNewsletterListFragment;
};

const NewsletterListItem = ({
  list,
  subscribeUrl,
  onSubscribe,
  onUnsubscribe,
}: NewsletterListItemProps) => {
  const {
    elements: { Alert, Button, Link },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const locked = list.status === NewsletterListUserStatus.Locked;
  const pending = list.status === NewsletterListUserStatus.Pending;
  const paused = list.status === NewsletterListUserStatus.Paused;
  const checked =
    list.status === NewsletterListUserStatus.Subscribed || pending || paused;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);

    try {
      await action();
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <NewsletterListItemWrapper data-locked={locked}>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            disabled={locked || busy}
            onChange={(_, subscribe) =>
              run(() =>
                subscribe ? onSubscribe(list.id) : onUnsubscribe(list.id)
              )
            }
          />
        }
        label={<strong>{list.name}</strong>}
      />

      {list.description && (
        <NewsletterListItemText>{list.description}</NewsletterListItemText>
      )}

      {pending && (
        <NewsletterListItemActions>
          <NewsletterListItemText>
            {t('newsletter.pendingConfirmation')}
          </NewsletterListItemText>
          <Button
            variant="text"
            disabled={busy}
            onClick={() => run(() => onSubscribe(list.id))}
          >
            {t('newsletter.resendConfirmation')}
          </Button>
        </NewsletterListItemActions>
      )}

      {paused && (
        <NewsletterListItemText>
          {t('newsletter.pausedNotice')}
        </NewsletterListItemText>
      )}

      {(locked || paused) && (
        <NewsletterListItemActions>
          <NewsletterListItemText>
            {list.lockedText || t('newsletter.lockedDefault')}
          </NewsletterListItemText>
          <Button
            variant="contained"
            LinkComponent={Link}
            href={list.lockedLinkUrl || subscribeUrl}
          >
            {t('newsletter.subscribeToUnlock')}
          </Button>
        </NewsletterListItemActions>
      )}

      {error && <Alert severity="error">{error}</Alert>}
    </NewsletterListItemWrapper>
  );
};

export const NewsletterList = ({
  data,
  error,
  className,
  subscribeUrl,
  onSubscribe,
  onUnsubscribe,
}: BuilderNewsletterListProps) => {
  const {
    elements: { Alert },
  } = useWebsiteBuilder();

  return (
    <NewsletterListWrapper className={className}>
      {error && <Alert severity="error">{error.message}</Alert>}

      {data?.myNewsletterLists.map(list => (
        <NewsletterListItem
          key={list.id}
          list={list}
          subscribeUrl={subscribeUrl}
          onSubscribe={onSubscribe}
          onUnsubscribe={onUnsubscribe}
        />
      ))}
    </NewsletterListWrapper>
  );
};
