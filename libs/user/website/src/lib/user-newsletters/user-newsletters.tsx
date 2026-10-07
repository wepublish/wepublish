import styled from '@emotion/styled';
import { MailchimpFormOptionSelection } from '@wepublish/block-content/website';
import { MailchimpFormOptionsLayout } from '@wepublish/website/api';
import {
  BuilderUserNewslettersProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const UserNewslettersWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const UserNewslettersActions = styled('div')`
  display: flex;
  justify-content: flex-end;
`;

type Selection = Record<string, Record<string, boolean>>;

const toSelection = (groups: BuilderUserNewslettersProps['groups']) =>
  Object.fromEntries(
    groups.map(({ syncProviderId, newsletters }) => [
      syncProviderId,
      Object.fromEntries(
        newsletters.map(({ interestId, subscribed }) => [
          interestId,
          subscribed,
        ])
      ),
    ])
  ) as Selection;

export function UserNewsletters({
  className,
  groups,
  layout = MailchimpFormOptionsLayout.Grid,
  onSave,
}: BuilderUserNewslettersProps) {
  const {
    elements: { H4, Alert, Button },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const [saved, setSaved] = useState(() => toSelection(groups));
  const [selection, setSelection] = useState(saved);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<
    { success: true } | { success: false; message: string } | null
  >(null);

  useEffect(() => {
    setSaved(toSelection(groups));
    setSelection(toSelection(groups));
  }, [groups]);

  const changes = groups
    .map(({ syncProviderId, newsletters }) => ({
      syncProviderId,
      newsletters: newsletters
        .filter(
          ({ interestId }) =>
            selection[syncProviderId]?.[interestId] !==
            saved[syncProviderId]?.[interestId]
        )
        .map(({ interestId }) => ({
          interestId,
          subscribed: !!selection[syncProviderId]?.[interestId],
        })),
    }))
    .filter(change => change.newsletters.length);

  const handleChange =
    (syncProviderId: string) => (interestId: string, checked: boolean) => {
      setResult(null);
      setSelection(current => ({
        ...current,
        [syncProviderId]: { ...current[syncProviderId], [interestId]: checked },
      }));
    };

  const handleSave = async () => {
    setIsSaving(true);
    setResult(null);

    try {
      for (const change of changes) {
        await onSave(change);
      }

      setSaved(selection);
      setResult({ success: true });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!groups.length) {
    return null;
  }

  return (
    <UserNewslettersWrapper className={className}>
      <H4 component="h2">{t('user.newsletters.title')}</H4>

      {groups.map(({ syncProviderId, newsletters }) => (
        <MailchimpFormOptionSelection
          key={syncProviderId}
          layout={layout}
          options={newsletters.map(
            ({ interestId, name, description, image }) => ({
              id: interestId,
              name,
              description,
              image,
            })
          )}
          selected={Object.entries(selection[syncProviderId] ?? {})
            .filter(([, subscribed]) => subscribed)
            .map(([interestId]) => interestId)}
          onChange={handleChange(syncProviderId)}
        />
      ))}

      {result?.success && (
        <Alert severity="success">{t('user.newsletters.saveSuccess')}</Alert>
      )}

      {result?.success === false && (
        <Alert severity="error">{result.message}</Alert>
      )}

      <UserNewslettersActions>
        <Button
          disabled={!changes.length || isSaving}
          onClick={handleSave}
        >
          {t('user.newsletters.save')}
        </Button>
      </UserNewslettersActions>
    </UserNewslettersWrapper>
  );
}
