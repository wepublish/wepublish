import styled from '@emotion/styled';
import {
  DryRunMailchimpSyncMutation,
  SyncProviderSettingsDocument,
  SyncProviderSettingsQuery,
  useDryRunMailchimpSyncMutation,
  useMailchimpInterestGroupsLazyQuery,
  useMailchimpListsLazyQuery,
  useMailchimpMergeFieldsLazyQuery,
  useSyncProviderSettingsQuery,
  useTriggerMailchimpSyncMutation,
  useUpdateSyncProviderSettingMutation,
} from '@wepublish/editor/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSync } from 'react-icons/md';
import { Checkbox, Form, Input, Loader, Message, toaster } from 'rsuite';
import { z } from 'zod';

import mailChimpLogo from './assets/mailchimp.webp';

const mergeFieldMappingSchema = z.object({
  tag: z.string().min(1),
  expression: z.string().min(1),
});

const interestGroupMappingSchema = z.object({
  groupId: z.string().min(1),
  expression: z.string().min(1),
});

const syncProviderSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  enabled: z.boolean().optional(),
  mailchimp_apiKey: z.string().nullish().or(z.literal('')),
  mailchimp_listId: z.string().nullish().or(z.literal('')),
  mailchimp_mergeFieldMappings: z.array(mergeFieldMappingSchema).optional(),
  mailchimp_interestGroupMappings: z
    .array(interestGroupMappingSchema)
    .optional(),
  mailchimp_defaultInterestGroupIds: z.array(z.string()).optional(),
});

type SyncProviderFormValues = z.infer<typeof syncProviderSchema>;

const SyncCard = styled(Card)`
  margin-bottom: 20px;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const HeaderLogo = styled.img`
  min-height: 16px;
  max-height: 28px;
  max-width: 150px;
`;

const MappingRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

const MappingInput = styled(Input)`
  flex: 1;
`;

const SectionTitle = styled(Typography)`
  margin-top: 16px;
  margin-bottom: 8px;
`;

const SyncStatusWrapper = styled.div`
  margin-top: 12px;
`;

type SyncProviderSetting =
  SyncProviderSettingsQuery['syncProviderSettings'][number];

export function MailchimpSyncIntegrationForm() {
  const { t } = useTranslation();
  const { data, loading, error } = useSyncProviderSettingsQuery();

  if (loading) return <Loader center />;
  if (error) return <Message type="error">{error.message}</Message>;

  const settings = data?.syncProviderSettings;
  if (!settings?.length) {
    return (
      <Message type="warning">{t('integrations.noSettingsFound')}</Message>
    );
  }

  return (
    <>
      {settings.map(setting => (
        <SyncProviderSettingCard
          key={setting.id}
          setting={setting}
        />
      ))}
    </>
  );
}

type DryRunResultData = DryRunMailchimpSyncMutation['dryRunMailchimpSync'];

const DryRunTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 13px;

  th,
  td {
    border: 1px solid #ddd;
    padding: 6px 8px;
    text-align: left;
  }

  th {
    background: #f5f5f5;
  }

  tr:nth-of-type(even) {
    background: #fafafa;
  }
`;

const DryRunWrapper = styled.div`
  margin-top: 16px;
  max-height: 400px;
  overflow: auto;
`;

function SyncProviderSettingCard({
  setting,
}: {
  setting: SyncProviderSetting;
}) {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResultData | null>(
    null
  );

  const [updateSettings, { loading: updating }] =
    useUpdateSyncProviderSettingMutation({
      refetchQueries: [{ query: SyncProviderSettingsDocument }],
    });

  const [triggerSync] = useTriggerMailchimpSyncMutation();
  const [dryRunSync] = useDryRunMailchimpSyncMutation();

  const [fetchLists, { data: listsData, loading: listsLoading }] =
    useMailchimpListsLazyQuery();
  const [fetchMergeFields, { data: mergeFieldsData }] =
    useMailchimpMergeFieldsLazyQuery();
  const [fetchInterestGroups, { data: interestGroupsData }] =
    useMailchimpInterestGroupsLazyQuery();

  const availableLists = listsData?.mailchimpLists ?? [];
  const availableMergeFields = mergeFieldsData?.mailchimpMergeFields ?? [];
  const availableInterestGroups =
    interestGroupsData?.mailchimpInterestGroups ?? [];

  useEffect(() => {
    if (setting.enabled) {
      fetchLists({ variables: { configId: setting.id } });
      if (setting.mailchimp_listId) {
        fetchMergeFields({
          variables: { configId: setting.id, listId: setting.mailchimp_listId },
        });
        fetchInterestGroups({
          variables: { configId: setting.id, listId: setting.mailchimp_listId },
        });
      }
    }
  }, [
    setting.id,
    setting.enabled,
    setting.mailchimp_listId,
    fetchLists,
    fetchMergeFields,
    fetchInterestGroups,
  ]);

  const {
    control,
    handleSubmit,
    formState: { isDirty },
    watch,
  } = useForm<SyncProviderFormValues>({
    resolver: zodResolver(syncProviderSchema),
    defaultValues: {
      name: setting.name ?? '',
      enabled: setting.enabled ?? false,
      mailchimp_apiKey: '',
      mailchimp_listId: setting.mailchimp_listId ?? '',
      mailchimp_mergeFieldMappings: setting.mailchimp_mergeFieldMappings ?? [],
      mailchimp_interestGroupMappings:
        setting.mailchimp_interestGroupMappings ?? [],
      mailchimp_defaultInterestGroupIds:
        setting.mailchimp_defaultInterestGroupIds ?? [],
    },
  });

  const watchedListId = watch('mailchimp_listId');

  useEffect(() => {
    if (setting.enabled && watchedListId) {
      fetchMergeFields({
        variables: { configId: setting.id, listId: watchedListId },
      });
      fetchInterestGroups({
        variables: { configId: setting.id, listId: watchedListId },
      });
    }
  }, [
    watchedListId,
    setting.id,
    setting.enabled,
    fetchMergeFields,
    fetchInterestGroups,
  ]);

  const {
    fields: mergeFields,
    append: appendMergeField,
    remove: removeMergeField,
  } = useFieldArray({
    control,
    name: 'mailchimp_mergeFieldMappings',
  });

  const {
    fields: interestFields,
    append: appendInterestGroup,
    remove: removeInterestGroup,
  } = useFieldArray({
    control,
    name: 'mailchimp_interestGroupMappings',
  });

  const saveSettings = useCallback(
    async (formData: SyncProviderFormValues) => {
      const variables: any = {
        id: setting.id,
        name: formData.name,
        enabled: formData.enabled,
        mailchimp_listId: formData.mailchimp_listId,
        mailchimp_mergeFieldMappings: formData.mailchimp_mergeFieldMappings,
        mailchimp_interestGroupMappings:
          formData.mailchimp_interestGroupMappings,
        mailchimp_defaultInterestGroupIds:
          formData.mailchimp_defaultInterestGroupIds,
      };

      if (formData.mailchimp_apiKey && formData.mailchimp_apiKey.length > 0) {
        variables.mailchimp_apiKey = formData.mailchimp_apiKey;
      }

      await updateSettings({ variables });
    },
    [updateSettings, setting.id]
  );

  const onSubmit = handleSubmit(async formData => {
    try {
      await saveSettings(formData);
      toaster.push(
        <Message type="success">{t('integrations.updateSuccess')}</Message>
      );
    } catch (e: any) {
      const detail = e?.graphQLErrors?.[0]?.message ?? e?.message ?? String(e);
      toaster.push(
        <Message
          type="error"
          closable
          duration={0}
        >
          {t('integrations.updateError')}: {detail}
        </Message>
      );
    }
  });

  const saveIfDirty = useCallback(async (): Promise<boolean> => {
    if (!isDirty) return true;
    return new Promise<boolean>(resolve => {
      handleSubmit(
        async formData => {
          try {
            await saveSettings(formData);
            resolve(true);
          } catch (e: any) {
            const detail =
              e?.graphQLErrors?.[0]?.message ?? e?.message ?? String(e);
            toaster.push(
              <Message
                type="error"
                closable
                duration={0}
              >
                {t('integrations.updateError')}: {detail}
              </Message>
            );
            resolve(false);
          }
        },
        () => resolve(false)
      )();
    });
  }, [isDirty, handleSubmit, saveSettings, t]);

  const handleTriggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      if (!(await saveIfDirty())) return;
      await triggerSync({ variables: { id: setting.id } });
      toaster.push(
        <Message type="success">
          {t('integrations.mailchimpSyncSettings.syncTriggered')}
        </Message>
      );
    } catch (e: any) {
      const detail = e?.graphQLErrors?.[0]?.message ?? e?.message ?? String(e);
      toaster.push(
        <Message
          type="error"
          closable
          duration={0}
        >
          {t('integrations.mailchimpSyncSettings.syncFailed')}: {detail}
        </Message>
      );
    } finally {
      setSyncing(false);
    }
  }, [triggerSync, setting.id, t, saveIfDirty]);

  const handleDryRun = useCallback(async () => {
    setDryRunning(true);
    setDryRunResult(null);
    try {
      if (!(await saveIfDirty())) return;
      const { data } = await dryRunSync({
        variables: { id: setting.id },
      });
      setDryRunResult(data?.dryRunMailchimpSync ?? null);
    } catch (e: any) {
      const detail = e?.graphQLErrors?.[0]?.message ?? e?.message ?? String(e);
      toaster.push(
        <Message
          type="error"
          closable
          duration={0}
        >
          {t('integrations.mailchimpSyncSettings.syncFailed')}: {detail}
        </Message>
      );
    } finally {
      setDryRunning(false);
    }
  }, [dryRunSync, setting.id, t, saveIfDirty]);

  return (
    <SyncCard variant="outlined">
      <Form
        fluid
        onSubmit={() => onSubmit()}
      >
        <CardContent>
          <Typography
            variant="h5"
            component={HeaderWrapper}
            marginBottom={2}
          >
            {setting.name || setting.type || 'Sync Provider'}
            <HeaderLogo
              src={mailChimpLogo}
              alt=""
            />
          </Typography>

          {/* Enabled */}
          <Form.Group controlId={`enabled-${setting.id}`}>
            <Controller
              name="enabled"
              control={control}
              render={({ field: { value, onChange, ...rest } }) => (
                <Checkbox
                  checked={!!value}
                  onChange={(_, c) => onChange(c)}
                  {...rest}
                >
                  {t('integrations.mailchimpSyncSettings.enabled')}
                </Checkbox>
              )}
            />
          </Form.Group>

          {/* Name */}
          <Form.Group controlId={`name-${setting.id}`}>
            <Form.ControlLabel>{t('name')}</Form.ControlLabel>
            <Controller
              name="name"
              control={control}
              render={({ field: { value, onChange, ...rest } }) => (
                <Form.Control
                  value={value ?? ''}
                  onChange={onChange}
                  {...rest}
                />
              )}
            />
          </Form.Group>

          {/* API Key */}
          <Form.Group controlId={`apiKey-${setting.id}`}>
            <Form.ControlLabel>
              {t('integrations.mailchimpSyncSettings.apiKey')}
            </Form.ControlLabel>
            <Controller
              name="mailchimp_apiKey"
              control={control}
              render={({ field: { value, onChange, ...rest } }) => (
                <Form.Control
                  value={value ?? ''}
                  onChange={onChange}
                  type="password"
                  autoComplete="one-time-code"
                  placeholder={t('integrations.placeholderSecret')}
                  {...rest}
                />
              )}
            />
          </Form.Group>

          {/* List ID */}
          <Form.Group controlId={`listId-${setting.id}`}>
            <Form.ControlLabel>
              {t('integrations.mailchimpSyncSettings.listId')}
            </Form.ControlLabel>
            <Controller
              name="mailchimp_listId"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  freeSolo
                  options={availableLists.map(l => l.id)}
                  getOptionLabel={id => {
                    const list = availableLists.find(l => l.id === id);
                    return list ?
                        `${list.name} (${list.memberCount} members)`
                      : id;
                  }}
                  filterOptions={(options, { inputValue }) =>
                    inputValue ?
                      options.filter(id => {
                        const list = availableLists.find(l => l.id === id);
                        const label = list ? `${list.name} ${list.id}` : id;
                        return label
                          .toLowerCase()
                          .includes(inputValue.toLowerCase());
                      })
                    : options
                  }
                  value={value ?? ''}
                  onChange={(_, newValue) => {
                    onChange(newValue ?? '');
                  }}
                  onInputChange={(_, inputValue, reason) => {
                    if (reason === 'input') onChange(inputValue);
                  }}
                  loading={listsLoading}
                  renderInput={params => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder={t(
                        'integrations.mailchimpSyncSettings.listId'
                      )}
                    />
                  )}
                />
              )}
            />
          </Form.Group>

          {/* Merge Field Mappings */}
          <SectionTitle variant="h6">
            {t('integrations.mailchimpSyncSettings.mergeFieldMappings')}
          </SectionTitle>
          <Typography
            variant="body2"
            color="textSecondary"
            gutterBottom
            sx={{ whiteSpace: 'pre-line' }}
          >
            {t('integrations.mailchimpSyncSettings.mergeFieldHelp')}
          </Typography>

          {mergeFields.map((field, index) => (
            <MappingRow key={field.id}>
              <Controller
                name={`mailchimp_mergeFieldMappings.${index}.tag`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    freeSolo
                    options={availableMergeFields.map(f => f.tag)}
                    getOptionLabel={tag => {
                      const mf = availableMergeFields.find(f => f.tag === tag);
                      return mf ? `${mf.tag} (${mf.name})` : tag;
                    }}
                    filterOptions={(options, { inputValue }) =>
                      inputValue ?
                        options.filter(tag => {
                          const mf = availableMergeFields.find(
                            f => f.tag === tag
                          );
                          const label = mf ? `${mf.tag} ${mf.name}` : tag;
                          return label
                            .toLowerCase()
                            .includes(inputValue.toLowerCase());
                        })
                      : options
                    }
                    value={value ?? ''}
                    onChange={(_, newValue) => {
                      onChange(newValue ?? '');
                    }}
                    onInputChange={(_, inputValue, reason) => {
                      if (reason === 'input') onChange(inputValue);
                    }}
                    sx={{ flex: 1 }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={t(
                          'integrations.mailchimpSyncSettings.mergeFieldTag'
                        )}
                      />
                    )}
                  />
                )}
              />
              <Controller
                name={`mailchimp_mergeFieldMappings.${index}.expression`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <MappingInput
                    value={value}
                    onChange={onChange}
                    placeholder={t(
                      'integrations.mailchimpSyncSettings.mergeFieldExpression'
                    )}
                  />
                )}
              />
              <IconButton
                size="small"
                onClick={() => removeMergeField(index)}
                color="error"
              >
                <MdDelete />
              </IconButton>
            </MappingRow>
          ))}

          <Button
            size="small"
            startIcon={<MdAdd />}
            onClick={() => appendMergeField({ tag: '', expression: '' })}
          >
            {t('integrations.mailchimpSyncSettings.addMergeField')}
          </Button>

          {/* Interest Group Mappings */}
          <SectionTitle variant="h6">
            {t('integrations.mailchimpSyncSettings.interestGroupMappings')}
          </SectionTitle>
          <Typography
            variant="body2"
            color="textSecondary"
            gutterBottom
            sx={{ whiteSpace: 'pre-line' }}
          >
            {t('integrations.mailchimpSyncSettings.interestGroupHelp')}
          </Typography>

          {interestFields.map((field, index) => (
            <MappingRow key={field.id}>
              <Controller
                name={`mailchimp_interestGroupMappings.${index}.groupId`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    freeSolo
                    options={availableInterestGroups.map(g => g.id)}
                    getOptionLabel={id => {
                      const group = availableInterestGroups.find(
                        g => g.id === id
                      );
                      return group ? `${group.name} (${group.id})` : id;
                    }}
                    filterOptions={(options, { inputValue }) =>
                      inputValue ?
                        options.filter(id => {
                          const group = availableInterestGroups.find(
                            g => g.id === id
                          );
                          const label =
                            group ? `${group.name} ${group.id}` : id;
                          return label
                            .toLowerCase()
                            .includes(inputValue.toLowerCase());
                        })
                      : options
                    }
                    value={value ?? ''}
                    onChange={(_, newValue) => {
                      onChange(newValue ?? '');
                    }}
                    onInputChange={(_, inputValue, reason) => {
                      if (reason === 'input') onChange(inputValue);
                    }}
                    sx={{ flex: 1 }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={t(
                          'integrations.mailchimpSyncSettings.interestGroupId'
                        )}
                      />
                    )}
                  />
                )}
              />
              <Controller
                name={`mailchimp_interestGroupMappings.${index}.expression`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <MappingInput
                    value={value}
                    onChange={onChange}
                    placeholder={t(
                      'integrations.mailchimpSyncSettings.interestGroupExpression'
                    )}
                  />
                )}
              />
              <IconButton
                size="small"
                onClick={() => removeInterestGroup(index)}
                color="error"
              >
                <MdDelete />
              </IconButton>
            </MappingRow>
          ))}

          <Button
            size="small"
            startIcon={<MdAdd />}
            onClick={() => appendInterestGroup({ groupId: '', expression: '' })}
          >
            {t('integrations.mailchimpSyncSettings.addInterestGroup')}
          </Button>

          {/* Default Interest Groups */}
          <SectionTitle variant="h6">
            {t('integrations.mailchimpSyncSettings.defaultInterestGroups')}
          </SectionTitle>
          <Typography
            variant="body2"
            color="textSecondary"
            gutterBottom
          >
            {t('integrations.mailchimpSyncSettings.defaultInterestGroupsHelp')}
          </Typography>
          <Controller
            name="mailchimp_defaultInterestGroupIds"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Autocomplete
                multiple
                options={availableInterestGroups}
                getOptionLabel={option =>
                  typeof option === 'string' ? option : (
                    `${option.name} (${option.id})`
                  )
                }
                value={(value ?? []).map(
                  id =>
                    availableInterestGroups.find(g => g.id === id) ?? {
                      id,
                      name: id,
                    }
                )}
                onChange={(_, newValue) => {
                  onChange(
                    newValue.map(v => (typeof v === 'string' ? v : v.id))
                  );
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                renderInput={params => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder={t(
                      'integrations.mailchimpSyncSettings.defaultInterestGroups'
                    )}
                  />
                )}
              />
            )}
          />

          {/* Sync Status */}
          <SyncStatusWrapper>
            {setting.lastSyncAt && (
              <Typography
                variant="body2"
                color="textSecondary"
              >
                {t('integrations.mailchimpSyncSettings.lastSync')}:{' '}
                {new Intl.DateTimeFormat('de-CH', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(setting.lastSyncAt))}
              </Typography>
            )}

            {setting.lastSyncError && (
              <Alert
                severity="error"
                sx={{ mt: 1 }}
              >
                {setting.lastSyncError}
              </Alert>
            )}

            {setting.enabled && (
              <Chip
                label={t('integrations.mailchimpSyncSettings.scheduledInfo')}
                color="info"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </SyncStatusWrapper>
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            type="submit"
            disabled={updating}
          >
            {updating && (
              <CircularProgress
                size={14}
                color="inherit"
                sx={{ mr: 1 }}
              />
            )}
            {t('save')}
          </Button>

          <Button
            variant="outlined"
            startIcon={
              syncing ?
                <CircularProgress
                  size={14}
                  color="inherit"
                />
              : <MdSync />
            }
            onClick={handleTriggerSync}
            disabled={syncing || !setting.enabled}
          >
            {t('integrations.mailchimpSyncSettings.triggerSync')}
          </Button>

          <Button
            variant="outlined"
            color="info"
            startIcon={
              dryRunning ?
                <CircularProgress
                  size={14}
                  color="inherit"
                />
              : <MdSync />
            }
            onClick={handleDryRun}
            disabled={dryRunning || !setting.enabled}
          >
            {t('integrations.mailchimpSyncSettings.dryRun')}
          </Button>
        </CardActions>

        {dryRunResult && (
          <CardContent>
            <Alert
              severity="info"
              sx={{ mb: 2 }}
            >
              {t('integrations.mailchimpSyncSettings.dryRunSummary', {
                updated: dryRunResult.updatedCount,
                skipped: dryRunResult.skippedCount,
              })}
            </Alert>

            {dryRunResult.changes.length > 0 && (
              <DryRunWrapper>
                <DryRunTable>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>
                        {t('integrations.mailchimpSyncSettings.dryRunStatus')}
                      </th>
                      <th>
                        {t(
                          'integrations.mailchimpSyncSettings.dryRunMergeFields'
                        )}
                      </th>
                      <th>
                        {t(
                          'integrations.mailchimpSyncSettings.dryRunInterests'
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRunResult.changes.map(change => (
                      <tr key={change.email}>
                        <td>{change.email}</td>
                        <td>
                          <Chip
                            label={
                              change.isNew ?
                                t(
                                  'integrations.mailchimpSyncSettings.dryRunNew'
                                )
                              : t(
                                  'integrations.mailchimpSyncSettings.dryRunUpdate'
                                )
                            }
                            color={change.isNew ? 'success' : 'warning'}
                            size="small"
                          />
                        </td>
                        <td>
                          <pre style={{ margin: 0, fontSize: 11 }}>
                            {JSON.stringify(change.mergeFields, null, 1)}
                          </pre>
                        </td>
                        <td>
                          <pre style={{ margin: 0, fontSize: 11 }}>
                            {JSON.stringify(change.interests, null, 1)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DryRunTable>
              </DryRunWrapper>
            )}
          </CardContent>
        )}
      </Form>
    </SyncCard>
  );
}
