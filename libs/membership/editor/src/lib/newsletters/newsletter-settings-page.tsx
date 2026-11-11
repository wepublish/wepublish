import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  MailchimpInterestGroupsDocument,
  SyncProviderSettingsDocument,
  SyncProviderType,
  UpdateSyncProviderSettingDocument,
} from '@wepublish/editor/api';
import {
  CanGetMailchimpSyncSettings,
  CanUpdateMailchimpSyncSettings,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  emptyInterestOption,
  enqueueSnackbar,
  humanizeError,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  MailchimpFormInterestOptionItem,
  MailchimpFormInterestOptionValue,
  PageTitle,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdCancel, MdSave } from 'react-icons/md';
import { Link } from 'react-router-dom';

export const MAILCHIMP_INTEGRATION_PATH = '/integrations/mailchimp-sync';

type NewsletterSettings = {
  newslettersInProfile: boolean;
  newsletters: MailchimpFormInterestOptionValue[];
};

/**
 * The newsletters readers can choose in their profile: Mailchimp interests of
 * the sync provider's list, with the name, description and image they are
 * shown with. They are also the defaults of the newsletter subscribe block.
 */
export function NewsletterSettingsPage() {
  const { t } = useTranslation();
  const canUpdate = useAuthorisation(CanUpdateMailchimpSyncSettings.id);

  const { data, loading } = useQuery(SyncProviderSettingsDocument);
  const provider = data?.syncProviderSettings.find(
    ({ type }) => type === SyncProviderType.Mailchimp
  );
  const listId = provider?.mailchimp_listId;

  const { data: interestData } = useQuery(MailchimpInterestGroupsDocument, {
    variables: { configId: provider?.id ?? '', listId: listId ?? '' },
    skip: !provider || !listId,
  });
  const interestOptions = useMemo(
    () =>
      (interestData?.mailchimpInterestGroups ?? []).map(({ id, name }) => ({
        value: id,
        label: name,
      })),
    [interestData?.mailchimpInterestGroups]
  );

  const saved = useMemo<NewsletterSettings>(
    () => ({
      newslettersInProfile: !!provider?.newslettersInProfile,
      newsletters: (provider?.newsletters ?? []).map(
        ({ interestId, name, description, image }) => ({
          id: interestId,
          name,
          description,
          image,
        })
      ),
    }),
    [provider]
  );

  const [value, setValue] = useState(saved);
  const [prevSaved, setPrevSaved] = useState(saved);
  const [saveAttempted, setSaveAttempted] = useState(false);

  // start over from what is stored whenever it (re)loads or was saved
  if (saved !== prevSaved) {
    setPrevSaved(saved);
    setValue(saved);
  }

  const [updateProvider, { loading: saving }] = useMutation(
    UpdateSyncProviderSettingDocument
  );

  const isDirty = JSON.stringify(value) !== JSON.stringify(saved);
  const isInvalid = value.newsletters.some(
    newsletter => !newsletter.id || !newsletter.name.trim()
  );
  const disabled = !canUpdate || saving;

  const updateNewsletters = (newsletters: MailchimpFormInterestOptionValue[]) =>
    setValue(current => ({ ...current, newsletters }));

  const move = (from: number, to: number) => {
    const next = [...value.newsletters];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateNewsletters(next);
  };

  const save = async () => {
    setSaveAttempted(true);

    if (!provider || isInvalid) {
      return;
    }

    try {
      await updateProvider({
        variables: {
          id: provider.id,
          newslettersInProfile: value.newslettersInProfile,
          newsletters: value.newsletters.map(
            ({ id, name, description, image }) => ({
              interestId: id,
              name: name.trim(),
              description,
              imageID: image?.id,
            })
          ),
        },
      });
      setSaveAttempted(false);
      enqueueSnackbar(t('newsletterSettings.saved'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(humanizeError(error), { variant: 'error' });
    }
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('newsletterSettings.title')}</PageTitle>
        </ListViewHeader>

        {canUpdate && listId && (
          <ListViewActions>
            <Button
              variant="outlined"
              startIcon={<MdCancel />}
              disabled={disabled || !isDirty}
              onClick={() => {
                setValue(saved);
                setSaveAttempted(false);
              }}
            >
              {t('cancel')}
            </Button>

            <Button
              variant="contained"
              startIcon={<MdSave />}
              disabled={disabled || !isDirty}
              onClick={save}
            >
              {t('save')}
            </Button>
          </ListViewActions>
        )}
      </ListViewContainer>

      <Stack
        spacing={2}
        sx={{ maxWidth: 1040 }}
      >
        <Typography color="textSecondary">
          {t('newsletterSettings.description')}
        </Typography>

        {!loading && !listId && (
          <Alert severity="info">
            {t('newsletterSettings.setUpHint')}{' '}
            <Link to={MAILCHIMP_INTEGRATION_PATH}>
              {t('newsletterSettings.setUpLink')}
            </Link>
          </Alert>
        )}

        {listId && (
          <>
            <Card>
              <CardHeader title={t('newsletterSettings.profile')} />

              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={value.newslettersInProfile}
                      disabled={disabled}
                      onChange={(_event, newslettersInProfile) =>
                        setValue(current => ({
                          ...current,
                          newslettersInProfile,
                        }))
                      }
                    />
                  }
                  label={t('newsletterSettings.showInProfile')}
                />
                <FormHelperText>
                  {t('newsletterSettings.showInProfileHelp')}
                </FormHelperText>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title={t('newsletterSettings.newsletters')}
                subheader={t('newsletterSettings.newslettersHelp')}
              />

              <CardContent>
                <Stack spacing={2}>
                  {value.newsletters.map((newsletter, index) => (
                    <MailchimpFormInterestOptionItem
                      key={index}
                      value={newsletter}
                      number={index + 1}
                      interestOptions={interestOptions}
                      disabled={disabled}
                      showErrors={saveAttempted}
                      onChange={patch =>
                        updateNewsletters(
                          value.newsletters.map((item, i) =>
                            i === index ? { ...item, ...patch } : item
                          )
                        )
                      }
                      onMoveUp={
                        index > 0 ? () => move(index, index - 1) : undefined
                      }
                      onMoveDown={
                        index < value.newsletters.length - 1 ?
                          () => move(index, index + 1)
                        : undefined
                      }
                      onRemove={() =>
                        updateNewsletters(
                          value.newsletters.filter((_, i) => i !== index)
                        )
                      }
                    />
                  ))}

                  <div>
                    <Button
                      size="small"
                      startIcon={<MdAdd />}
                      disabled={disabled}
                      onClick={() =>
                        updateNewsletters([
                          ...value.newsletters,
                          emptyInterestOption(),
                        ])
                      }
                    >
                      {t('integrations.mailchimpSyncSettings.addNewsletter')}
                    </Button>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetMailchimpSyncSettings.id,
  CanUpdateMailchimpSyncSettings.id,
])(NewsletterSettingsPage);

export { CheckedPermissionComponent as NewsletterSettings };
