import styled from '@emotion/styled';
import {
  DryRunMailchimpSyncMutation,
  SyncProviderSettingsDocument,
  SyncProviderSettingsQuery,
  useDeleteAllMailchimpSyncErrorsMutation,
  useDeleteMailchimpSyncErrorMutation,
  useDryRunMailchimpSyncMutation,
  useMailchimpInterestGroupsLazyQuery,
  useMailchimpSyncErrorsQuery,
  useMailchimpSyncProgressQuery,
  useMailchimpListsLazyQuery,
  useMailchimpMergeFieldsLazyQuery,
  useMemberPlanListQuery,
  useSyncProviderSettingsQuery,
  useTriggerMailchimpSyncMutation,
  useUpdateSyncProviderSettingMutation,
} from '@wepublish/editor/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { MdDelete, MdExpandMore, MdSync } from 'react-icons/md';
import { Checkbox, Form, Loader, Message, toaster } from 'rsuite';
import { z } from 'zod';

import mailChimpLogo from './assets/mailchimp.webp';

const memberPlanMappingSchema = z.object({
  activeFieldIds: z.array(z.string()).optional(),
  retargetFieldIds: z.array(z.string()).optional(),
  retargetDelayDays: z.number().optional(),
  interestGroupIds: z.array(z.string()).optional(),
});

const clickTrackingExtensionSchema = z.object({
  enabled: z.boolean().optional(),
  config: z
    .object({
      urlPattern: z
        .string()
        .refine(
          value => {
            if (!value) return true;
            try {
              new RegExp(value);
              return true;
            } catch {
              return false;
            }
          },
          { message: 'Invalid regular expression' }
        )
        .optional()
        .default(''),
      pathSegmentIndex: z.number().int().min(0).max(10).optional().default(2),
      mergeFieldTag: z.string().optional().default(''),
      lookbackHours: z.number().int().min(1).max(720).optional().default(30),
      requireQueryParam: z.string().optional().default('answerId'),
    })
    .optional()
    .default({}),
});

const syncProviderSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  enabled: z.boolean().optional(),
  mailchimp_apiKey: z.string().nullish().or(z.literal('')),
  mailchimp_listId: z.string().nullish().or(z.literal('')),
  mailchimp_defaultInterestGroupIds: z.array(z.string()).optional(),
  mailchimp_extensions: z
    .object({
      'click-tracking': clickTrackingExtensionSchema.optional(),
    })
    .optional()
    .default({}),
  firstnameFields: z.array(z.string()).optional(),
  lastnameFields: z.array(z.string()).optional(),
  mailchimpMappings: z.record(z.string(), memberPlanMappingSchema).optional(),
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

const SectionTitle = styled(Typography)`
  margin-top: 16px;
  margin-bottom: 8px;
`;

const SyncStatusWrapper = styled.div`
  margin-top: 12px;
`;

const MemberPlanGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 1fr 2fr;
  gap: 8px;
  align-items: center;
`;

const MemberPlanInput = styled.div``;

const NameFieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 8px;
  align-items: center;
`;

type SyncProviderSetting =
  SyncProviderSettingsQuery['syncProviderSettings'][number];

function truncate(value: string, maxLength = 35): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

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

const MergeFieldsTwoColumn = styled.div`
  display: flex;
  gap: 8px;
  max-height: 100px;
  overflow: auto;
`;

const MergeFieldColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  const [syncSeq, setSyncSeq] = useState(0);
  const [dryRunning, setDryRunning] = useState(false);
  const [syncLimit, setSyncLimit] = useState<number | undefined>(100);
  const [dryRunResult, setDryRunResult] = useState<DryRunResultData | null>(
    null
  );

  const { data: progressData } = useMailchimpSyncProgressQuery({
    variables: { configId: setting.id },
    pollInterval: syncing ? 2000 : 0,
    fetchPolicy: 'no-cache',
    // Force refetch when a new sync is triggered
    context: { seq: syncSeq },
  });
  const syncProgress =
    syncing ? (progressData?.mailchimpSyncProgress ?? null) : null;

  const [updateSettings, { loading: updating }] =
    useUpdateSyncProviderSettingMutation({
      refetchQueries: [{ query: SyncProviderSettingsDocument }],
    });

  const [triggerSync] = useTriggerMailchimpSyncMutation();
  const [dryRunSync] = useDryRunMailchimpSyncMutation();

  const [syncErrorsSkip, setSyncErrorsSkip] = useState(0);
  const { data: syncErrorsData, refetch: refetchErrors } =
    useMailchimpSyncErrorsQuery({
      variables: { configId: setting.id, take: 10, skip: syncErrorsSkip },
      skip: !setting.enabled,
    });
  const [deleteError] = useDeleteMailchimpSyncErrorMutation();
  const [deleteAllErrors] = useDeleteAllMailchimpSyncErrorsMutation();

  const syncErrors = syncErrorsData?.mailchimpSyncErrors;

  const { data: memberPlanData } = useMemberPlanListQuery({
    variables: { take: 200 },
  });
  const memberPlanSlugs = [...(memberPlanData?.memberPlans?.nodes ?? [])]
    .sort((a, b) => a.amountPerMonthMin - b.amountPerMonthMin)
    .map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
    }));

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
    fetchLists({ variables: { configId: setting.id } });
    if (setting.mailchimp_listId) {
      fetchMergeFields({
        variables: { configId: setting.id, listId: setting.mailchimp_listId },
      });
      fetchInterestGroups({
        variables: { configId: setting.id, listId: setting.mailchimp_listId },
      });
    }
  }, [
    setting.id,
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
      mailchimp_defaultInterestGroupIds:
        setting.mailchimp_defaultInterestGroupIds ?? [],
      firstnameFields: setting.firstnameFields ?? [],
      lastnameFields: setting.lastnameFields ?? [],
      mailchimpMappings: Object.fromEntries(
        (setting.mailchimpMappings ?? []).map(mapping => [
          mapping.memberPlanId,
          {
            activeFieldIds: mapping.activeFieldIds ?? [],
            retargetFieldIds: mapping.retargetFieldIds ?? [],
            retargetDelayDays: mapping.retargetDelayDays ?? 30,
            interestGroupIds: mapping.interestGroupIds ?? [],
          },
        ])
      ),
      mailchimp_extensions: {
        'click-tracking': {
          enabled:
            (setting.mailchimp_extensions as any)?.['click-tracking']
              ?.enabled ?? false,
          config: {
            urlPattern:
              (setting.mailchimp_extensions as any)?.['click-tracking']?.config
                ?.urlPattern ?? '',
            pathSegmentIndex:
              (setting.mailchimp_extensions as any)?.['click-tracking']?.config
                ?.pathSegmentIndex ?? 2,
            mergeFieldTag:
              (setting.mailchimp_extensions as any)?.['click-tracking']?.config
                ?.mergeFieldTag ?? '',
            lookbackHours:
              (setting.mailchimp_extensions as any)?.['click-tracking']?.config
                ?.lookbackHours ?? 30,
            requireQueryParam:
              (setting.mailchimp_extensions as any)?.['click-tracking']?.config
                ?.requireQueryParam ?? 'answerId',
          },
        },
      },
    },
  });

  const watchedListId = watch('mailchimp_listId');
  const watchedMailchimpMappings = watch('mailchimpMappings');
  const watchedDefaultInterestGroupIds = watch(
    'mailchimp_defaultInterestGroupIds'
  );

  useEffect(() => {
    if (watchedListId) {
      fetchMergeFields({
        variables: { configId: setting.id, listId: watchedListId },
      });
      fetchInterestGroups({
        variables: { configId: setting.id, listId: watchedListId },
      });
    }
  }, [watchedListId, setting.id, fetchMergeFields, fetchInterestGroups]);

  const saveSettings = useCallback(
    async (formData: SyncProviderFormValues) => {
      const variables: any = {
        id: setting.id,
        name: formData.name,
        enabled: formData.enabled,
        mailchimp_listId: formData.mailchimp_listId,
        mailchimp_defaultInterestGroupIds:
          formData.mailchimp_defaultInterestGroupIds,
        mailchimp_extensions: formData.mailchimp_extensions ?? {},
        firstnameFields: formData.firstnameFields ?? [],
        lastnameFields: formData.lastnameFields ?? [],
        mailchimpMappings: Object.entries(formData.mailchimpMappings ?? {})
          .map(([memberPlanId, mapping]) => ({
            memberPlanId,
            activeFieldIds: mapping?.activeFieldIds ?? [],
            retargetFieldIds: mapping?.retargetFieldIds ?? [],
            retargetDelayDays: mapping?.retargetDelayDays ?? 30,
            interestGroupIds: mapping?.interestGroupIds ?? [],
          }))
          .filter(
            mapping =>
              mapping.activeFieldIds.length > 0 ||
              mapping.retargetFieldIds.length > 0 ||
              mapping.interestGroupIds.length > 0
          ),
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

  // Stop polling and show result when sync finishes
  useEffect(() => {
    if (!syncing) return;

    // If progress is null after syncing started, the sync likely completed
    // before polling started (small dataset) — treat as done after a brief wait
    if (!syncProgress) {
      const timeout = setTimeout(() => {
        setSyncing(false);
        refetchErrors();
      }, 6000);
      return () => clearTimeout(timeout);
    }

    if (syncProgress.status === 'running') return;

    setSyncing(false);
    refetchErrors();
    if (syncProgress.status === 'failed') {
      toaster.push(
        <Message
          type="error"
          closable
          duration={0}
        >
          {t('integrations.mailchimpSyncSettings.syncFailed')}:{' '}
          {syncProgress.errorMessage}
        </Message>
      );
    } else if (syncProgress.status === 'completed') {
      toaster.push(
        <Message type="success">
          {t('integrations.mailchimpSyncSettings.syncCompleted', {
            updated: syncProgress.updated,
            skipped: syncProgress.skipped,
            errors: syncProgress.errors,
          })}
        </Message>
      );
    }
  }, [syncing, syncProgress?.status]);

  const handleTriggerSync = useCallback(async () => {
    try {
      if (!(await saveIfDirty())) return;
      setDryRunResult(null);
      await triggerSync({ variables: { id: setting.id } });
      setSyncSeq(s => s + 1);
      setSyncing(true);
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
    }
  }, [triggerSync, setting.id, t, saveIfDirty]);

  const handleDryRun = useCallback(async () => {
    setDryRunning(true);
    setDryRunResult(null);
    try {
      if (!(await saveIfDirty())) return;
      const { data } = await dryRunSync({
        variables: { id: setting.id, limit: syncLimit },
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
  }, [dryRunSync, setting.id, t, saveIfDirty, syncLimit]);

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
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 0.5 }}
            >
              <Trans
                t={t}
                i18nKey="integrations.mailchimpSyncSettings.apiKeyHelp"
                components={{
                  mailchimpLink: (
                    <Link
                      href="https://us3.admin.mailchimp.com/account/api/"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            </Typography>
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
                <Select
                  fullWidth
                  size="small"
                  displayEmpty
                  disabled={listsLoading}
                  value={value ?? ''}
                  onChange={e => onChange(e.target.value)}
                  renderValue={selected => {
                    if (!selected) {
                      return (
                        <Typography
                          component="span"
                          color="textSecondary"
                        >
                          {t('integrations.mailchimpSyncSettings.listId')}
                        </Typography>
                      );
                    }
                    const list = availableLists.find(l => l.id === selected);
                    return list ?
                        t('integrations.mailchimpSyncSettings.listOption', {
                          name: list.name,
                          count: list.memberCount,
                        })
                      : selected;
                  }}
                >
                  {value && !availableLists.some(l => l.id === value) && (
                    <MenuItem value={value}>{value}</MenuItem>
                  )}
                  {availableLists.map(list => (
                    <MenuItem
                      key={list.id}
                      value={list.id}
                    >
                      {t('integrations.mailchimpSyncSettings.listOption', {
                        name: list.name,
                        count: list.memberCount,
                      })}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 0.5 }}
            >
              <Trans
                t={t}
                i18nKey="integrations.mailchimpSyncSettings.listIdHelp"
                components={{
                  mailchimpLink: (
                    <Link
                      href="https://us3.admin.mailchimp.com/audience/settings/"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            </Typography>
          </Form.Group>

          <Form.Group controlId={`name-fields-${setting.id}`}>
            <NameFieldGrid>
              <MemberPlanInput>
                <Typography variant="body1">
                  {t('integrations.mailchimpSyncSettings.firstName')}
                </Typography>
                <Typography variant="body2">
                  {t('integrations.mailchimpSyncSettings.firstNameHelp')}
                </Typography>
              </MemberPlanInput>
              <MemberPlanInput>
                <Controller
                  name="firstnameFields"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      multiple
                      size="small"
                      sx={{ flex: 1 }}
                      options={availableMergeFields.map(f => f.tag)}
                      getOptionLabel={tag => {
                        const mf = availableMergeFields.find(
                          f => f.tag === tag
                        );
                        return mf ? mf.name : tag;
                      }}
                      value={value ?? []}
                      onChange={(_, newValue) => onChange(newValue)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          size="small"
                          label={t(
                            'integrations.mailchimpSyncSettings.firstName'
                          )}
                        />
                      )}
                    />
                  )}
                />
              </MemberPlanInput>
              <MemberPlanInput>
                <Typography variant="body1">
                  {t('integrations.mailchimpSyncSettings.lastName')}
                </Typography>
                <Typography variant="body2">
                  {t('integrations.mailchimpSyncSettings.lastNameHelp')}
                </Typography>
              </MemberPlanInput>
              <MemberPlanInput>
                <Controller
                  name="lastnameFields"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      multiple
                      size="small"
                      sx={{ flex: 1 }}
                      options={availableMergeFields.map(f => f.tag)}
                      getOptionLabel={tag => {
                        const mf = availableMergeFields.find(
                          f => f.tag === tag
                        );
                        return mf ? mf.name : tag;
                      }}
                      value={value ?? []}
                      onChange={(_, newValue) => onChange(newValue)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          size="small"
                          label={t(
                            'integrations.mailchimpSyncSettings.lastName'
                          )}
                        />
                      )}
                    />
                  )}
                />
              </MemberPlanInput>
            </NameFieldGrid>
          </Form.Group>

          <Form.Group controlId={`mailchimp-mappings-${setting.id}`}>
            <MemberPlanGrid>
              <MemberPlanInput>
                <Typography variant="body1">
                  {t('integrations.mailchimpSyncSettings.subscription')}
                </Typography>
              </MemberPlanInput>
              <MemberPlanInput>
                <Typography variant="body1">
                  {t('integrations.mailchimpSyncSettings.activeFields')}
                </Typography>
                <Typography variant="body2">
                  {t('integrations.mailchimpSyncSettings.activeFieldsHelp')}
                </Typography>
              </MemberPlanInput>
              <MemberPlanInput>
                <Typography variant="body1">
                  {t('integrations.mailchimpSyncSettings.retargetFields')}
                </Typography>
                <Typography variant="body2">
                  {t('integrations.mailchimpSyncSettings.retargetFieldsHelp')}
                </Typography>
              </MemberPlanInput>
              <MemberPlanInput>
                <Typography variant="body1">
                  {t('integrations.mailchimpSyncSettings.retargetDelay')}
                </Typography>
                <Typography variant="body2">
                  {t('integrations.mailchimpSyncSettings.retargetDelayHelp')}
                </Typography>
              </MemberPlanInput>
              <MemberPlanInput>
                <Typography variant="body1">
                  {t('integrations.mailchimpSyncSettings.interestGroups')}
                </Typography>
                <Typography variant="body2">
                  {t('integrations.mailchimpSyncSettings.interestGroupsHelp')}
                </Typography>
              </MemberPlanInput>
              {memberPlanSlugs.map(plan => (
                <Fragment key={plan.slug}>
                  <Typography variant="body1">{plan.name}</Typography>
                  <MemberPlanInput>
                    <Controller
                      name={`mailchimpMappings.${plan.id}.activeFieldIds`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          multiple
                          size="small"
                          sx={{ flex: 1 }}
                          options={availableMergeFields.map(f => f.tag)}
                          getOptionLabel={tag => {
                            const mf = availableMergeFields.find(
                              f => f.tag === tag
                            );
                            return mf ? mf.name : tag;
                          }}
                          value={value ?? []}
                          onChange={(_, newValue) => onChange(newValue)}
                          renderInput={params => (
                            <TextField
                              {...params}
                              size="small"
                              label={t(
                                'integrations.mailchimpSyncSettings.activeFields'
                              )}
                            />
                          )}
                        />
                      )}
                    />
                  </MemberPlanInput>
                  <MemberPlanInput>
                    <Controller
                      name={`mailchimpMappings.${plan.id}.retargetFieldIds`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          multiple
                          size="small"
                          sx={{ flex: 1 }}
                          options={availableMergeFields.map(f => f.tag)}
                          getOptionLabel={tag => {
                            const mf = availableMergeFields.find(
                              f => f.tag === tag
                            );
                            return mf ? mf.name : tag;
                          }}
                          value={value ?? []}
                          onChange={(_, newValue) => onChange(newValue)}
                          renderInput={params => (
                            <TextField
                              {...params}
                              size="small"
                              label={t(
                                'integrations.mailchimpSyncSettings.retargetFields'
                              )}
                            />
                          )}
                        />
                      )}
                    />
                  </MemberPlanInput>
                  <MemberPlanInput>
                    <Controller
                      name={`mailchimpMappings.${plan.id}.retargetDelayDays`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          size="small"
                          type="number"
                          label={t(
                            'integrations.mailchimpSyncSettings.retargetDelayLabel'
                          )}
                          sx={{ width: 160 }}
                          InputProps={{ inputProps: { min: 0 } }}
                          value={value ?? ''}
                          onChange={e =>
                            onChange(
                              e.target.value === '' ?
                                undefined
                              : parseInt(e.target.value, 10)
                            )
                          }
                        />
                      )}
                    />
                  </MemberPlanInput>
                  <MemberPlanInput>
                    <Controller
                      name={`mailchimpMappings.${plan.id}.interestGroupIds`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          multiple
                          size="small"
                          sx={{ flex: 1 }}
                          options={availableInterestGroups.map(g => g.id)}
                          getOptionLabel={id => {
                            const group = availableInterestGroups.find(
                              g => g.id === id
                            );
                            return group ? truncate(group.name) : id;
                          }}
                          value={value ?? []}
                          onChange={(_, newValue) => onChange(newValue)}
                          renderInput={params => (
                            <TextField
                              {...params}
                              size="small"
                              label={t(
                                'integrations.mailchimpSyncSettings.interestGroups'
                              )}
                            />
                          )}
                        />
                      )}
                    />
                  </MemberPlanInput>
                </Fragment>
              ))}
            </MemberPlanGrid>
          </Form.Group>
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
              <Select
                fullWidth
                multiple
                size="small"
                displayEmpty
                value={value ?? []}
                onChange={e =>
                  onChange(
                    typeof e.target.value === 'string' ?
                      e.target.value.split(',')
                    : e.target.value
                  )
                }
                renderValue={selected => {
                  if (!selected.length) {
                    return (
                      <Typography
                        component="span"
                        color="textSecondary"
                      >
                        {t(
                          'integrations.mailchimpSyncSettings.defaultInterestGroups'
                        )}
                      </Typography>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {selected.map(id => {
                        const group = availableInterestGroups.find(
                          g => g.id === id
                        );
                        return (
                          <Chip
                            key={id}
                            size="small"
                            label={group ? group.name : id}
                          />
                        );
                      })}
                    </div>
                  );
                }}
              >
                {availableInterestGroups.map(group => (
                  <MenuItem
                    key={group.id}
                    value={group.id}
                  >
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          />

          {/* Advanced Extensions */}
          <Accordion
            sx={{ mt: 3 }}
            variant="outlined"
          >
            <AccordionSummary expandIcon={<MdExpandMore />}>
              <Typography variant="subtitle1">
                {t('integrations.mailchimpSyncSettings.extensions')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography
                variant="subtitle2"
                gutterBottom
              >
                {t('integrations.mailchimpSyncSettings.clickTracking.title')}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                gutterBottom
              >
                {t('integrations.mailchimpSyncSettings.clickTracking.help')}
              </Typography>

              <Controller
                name="mailchimp_extensions.click-tracking.enabled"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!value}
                        onChange={(_, c) => onChange(c)}
                      />
                    }
                    label={t(
                      'integrations.mailchimpSyncSettings.clickTracking.enabled'
                    )}
                  />
                )}
              />

              <Controller
                name="mailchimp_extensions.click-tracking.config.urlPattern"
                control={control}
                render={({
                  field: { value, onChange },
                  fieldState: { error },
                }) => (
                  <TextField
                    size="small"
                    fullWidth
                    sx={{ mt: 2 }}
                    label={t(
                      'integrations.mailchimpSyncSettings.clickTracking.urlPattern'
                    )}
                    placeholder="https://bajour\\.ch/pool/"
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    error={!!error}
                    helperText={
                      error?.message ??
                      t(
                        'integrations.mailchimpSyncSettings.clickTracking.urlPatternHelp'
                      )
                    }
                  />
                )}
              />

              <Controller
                name="mailchimp_extensions.click-tracking.config.pathSegmentIndex"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    size="small"
                    type="number"
                    sx={{ mt: 2, width: 200 }}
                    label={t(
                      'integrations.mailchimpSyncSettings.clickTracking.pathSegmentIndex'
                    )}
                    InputProps={{ inputProps: { min: 0, max: 10 } }}
                    value={value ?? 2}
                    onChange={e =>
                      onChange(parseInt(e.target.value || '0', 10))
                    }
                    helperText={t(
                      'integrations.mailchimpSyncSettings.clickTracking.pathSegmentIndexHelp'
                    )}
                  />
                )}
              />

              <Controller
                name="mailchimp_extensions.click-tracking.config.mergeFieldTag"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    freeSolo
                    options={availableMergeFields.map(f => f.tag)}
                    getOptionLabel={tag => {
                      const field = availableMergeFields.find(
                        f => f.tag === tag
                      );
                      return field ? `${field.name} (${field.tag})` : tag;
                    }}
                    value={value ?? ''}
                    onChange={(_, newValue) => onChange(newValue ?? '')}
                    onInputChange={(_, inputValue, reason) => {
                      if (reason === 'input') onChange(inputValue);
                    }}
                    sx={{ mt: 2 }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        size="small"
                        label={t(
                          'integrations.mailchimpSyncSettings.clickTracking.mergeFieldTag'
                        )}
                        helperText={t(
                          'integrations.mailchimpSyncSettings.clickTracking.mergeFieldTagHelp'
                        )}
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="mailchimp_extensions.click-tracking.config.requireQueryParam"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    size="small"
                    sx={{ mt: 2, width: 280 }}
                    label={t(
                      'integrations.mailchimpSyncSettings.clickTracking.requireQueryParam'
                    )}
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    helperText={t(
                      'integrations.mailchimpSyncSettings.clickTracking.requireQueryParamHelp'
                    )}
                  />
                )}
              />

              <Controller
                name="mailchimp_extensions.click-tracking.config.lookbackHours"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    size="small"
                    type="number"
                    sx={{ mt: 2, ml: 2, width: 200 }}
                    label={t(
                      'integrations.mailchimpSyncSettings.clickTracking.lookbackHours'
                    )}
                    InputProps={{ inputProps: { min: 1, max: 720 } }}
                    value={value ?? 30}
                    onChange={e =>
                      onChange(parseInt(e.target.value || '0', 10))
                    }
                    helperText={t(
                      'integrations.mailchimpSyncSettings.clickTracking.lookbackHoursHelp'
                    )}
                  />
                )}
              />
            </AccordionDetails>
          </Accordion>

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

        <CardActions sx={{ flexWrap: 'wrap', gap: 1 }}>
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

          <TextField
            size="small"
            type="number"
            value={syncLimit ?? ''}
            onChange={e => {
              const val = e.target.value;
              setSyncLimit(val === '' ? undefined : parseInt(val, 10));
            }}
            placeholder={t('integrations.mailchimpSyncSettings.allUsers')}
            label={t('integrations.mailchimpSyncSettings.dryRunLimit')}
            sx={{ width: 130 }}
            InputProps={{ inputProps: { min: 1 } }}
          />

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
            disabled={dryRunning}
          >
            {t('integrations.mailchimpSyncSettings.dryRun')}
          </Button>
        </CardActions>

        {syncing && (
          <CardContent>
            <LinearProgress
              variant={
                syncProgress && syncProgress.total > 0 ?
                  'determinate'
                : 'indeterminate'
              }
              value={
                syncProgress && syncProgress.total > 0 ?
                  (syncProgress.processed / syncProgress.total) * 100
                : 0
              }
              sx={{ mb: 1 }}
            />
            {syncProgress ?
              <Typography
                variant="body2"
                color="textSecondary"
              >
                {syncProgress.processed} / {syncProgress.total} (
                {syncProgress.updated}{' '}
                {t('integrations.mailchimpSyncSettings.progressUpdated')},{' '}
                {syncProgress.skipped}{' '}
                {t('integrations.mailchimpSyncSettings.progressSkipped')}
                {syncProgress.errors > 0 &&
                  `, ${syncProgress.errors} ${t('integrations.mailchimpSyncSettings.progressErrors')}`}
                )
              </Typography>
            : <Typography
                variant="body2"
                color="textSecondary"
              >
                {t('integrations.mailchimpSyncSettings.syncStarting')}
              </Typography>
            }
          </CardContent>
        )}

        {dryRunResult && (
          <CardContent>
            <Alert
              severity="info"
              sx={{ mb: 2 }}
            >
              {t('integrations.mailchimpSyncSettings.dryRunSummary', {
                updated: dryRunResult.updatedCount,
                skipped: dryRunResult.skippedCount,
                total: dryRunResult.totalUserCount,
              })}
            </Alert>

            {dryRunResult.changes.length > 0 && (
              <DryRunWrapper>
                <DryRunTable>
                  <thead>
                    <tr>
                      <th>
                        {t('integrations.mailchimpSyncSettings.emailLabel')}
                      </th>
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
                    {dryRunResult.changes.map(change => {
                      const mappedInterestIds = new Set<string>([
                        ...Object.values(watchedMailchimpMappings ?? {})
                          .flatMap(m => m?.interestGroupIds ?? [])
                          .filter(Boolean),
                        ...(watchedDefaultInterestGroupIds ?? []).filter(
                          Boolean
                        ),
                      ]);
                      const filteredInterestEntries = Object.entries(
                        change.interests || {}
                      ).filter(([key]) => mappedInterestIds.has(key));

                      const mergeFieldLabel = (tag: string) => {
                        const mf = availableMergeFields.find(
                          f => f.tag === tag
                        );
                        return mf ? `${tag} (${mf.name})` : tag;
                      };

                      const interestLabel = (groupId: string) => {
                        const ig = availableInterestGroups.find(
                          g => g.id === groupId
                        );
                        return ig ? ig.name : groupId;
                      };

                      const valuesEquivalent = (a: any, b: any): boolean => {
                        if (a === b) return true;
                        const aEmpty = a == null || a === '';
                        const bEmpty = b == null || b === '';
                        if (aEmpty && bEmpty) return true;
                        if (aEmpty !== bEmpty) return false;
                        if ((a === '0' || a === 0) && (b === '' || b == null))
                          return true;
                        if ((b === '0' || b === 0) && (a === '' || a == null))
                          return true;
                        return String(a).trim() === String(b).trim();
                      };

                      const formatChange = (value: any, prevValue: any) => {
                        if (change.isNew && prevValue === undefined) {
                          return `→ ${JSON.stringify(value)}`;
                        }
                        if (
                          prevValue !== undefined &&
                          !valuesEquivalent(prevValue, value)
                        ) {
                          return `${JSON.stringify(prevValue)} → ${JSON.stringify(value)}`;
                        }
                        return JSON.stringify(value);
                      };

                      return (
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
                            <MergeFieldsTwoColumn>
                              <MergeFieldColumn>
                                {Object.entries(change.mergeFields || {}).map(
                                  ([key, value], idx) => {
                                    if (idx % 2 !== 0) return null;
                                    return (
                                      <div
                                        key={key}
                                        style={{ whiteSpace: 'nowrap' }}
                                      >
                                        <strong>{mergeFieldLabel(key)}:</strong>{' '}
                                        {formatChange(
                                          value,
                                          change.previousMergeFields?.[key]
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </MergeFieldColumn>
                              <MergeFieldColumn>
                                {Object.entries(change.mergeFields || {}).map(
                                  ([key, value], idx) => {
                                    if (idx % 2 === 0) return null;
                                    return (
                                      <div
                                        key={key}
                                        style={{ whiteSpace: 'nowrap' }}
                                      >
                                        <strong>{mergeFieldLabel(key)}:</strong>{' '}
                                        {formatChange(
                                          value,
                                          change.previousMergeFields?.[key]
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </MergeFieldColumn>
                            </MergeFieldsTwoColumn>
                          </td>
                          <td>
                            {filteredInterestEntries.length > 0 ?
                              <MergeFieldsTwoColumn>
                                <MergeFieldColumn>
                                  {filteredInterestEntries.map(
                                    ([key, value], idx) => {
                                      if (idx % 2 !== 0) return null;
                                      return (
                                        <div
                                          key={key}
                                          style={{ whiteSpace: 'nowrap' }}
                                        >
                                          <strong>{interestLabel(key)}:</strong>{' '}
                                          {formatChange(
                                            value,
                                            change.previousInterests?.[key]
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </MergeFieldColumn>
                                <MergeFieldColumn>
                                  {filteredInterestEntries.map(
                                    ([key, value], idx) => {
                                      if (idx % 2 === 0) return null;
                                      return (
                                        <div
                                          key={key}
                                          style={{ whiteSpace: 'nowrap' }}
                                        >
                                          <strong>{interestLabel(key)}:</strong>{' '}
                                          {formatChange(
                                            value,
                                            change.previousInterests?.[key]
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </MergeFieldColumn>
                              </MergeFieldsTwoColumn>
                            : <Typography
                                variant="body2"
                                color="textSecondary"
                              >
                                —
                              </Typography>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </DryRunTable>
              </DryRunWrapper>
            )}
          </CardContent>
        )}
      </Form>

      {syncErrors && (
        <CardContent>
          <SectionTitle variant="h6">
            {t('integrations.mailchimpSyncSettings.syncErrors')} (
            {syncErrors.totalCount})
          </SectionTitle>

          {syncErrors.totalCount === 0 ?
            <Alert severity="success">
              {t('integrations.mailchimpSyncSettings.noSyncErrors')}
            </Alert>
          : <>
              <Button
                size="small"
                color="warning"
                variant="outlined"
                onClick={async () => {
                  await deleteAllErrors({
                    variables: { configId: setting.id },
                  });
                  refetchErrors();
                }}
                sx={{ mb: 1 }}
              >
                {t('integrations.mailchimpSyncSettings.clearAllErrors')}
              </Button>

              <DryRunWrapper>
                <DryRunTable>
                  <thead>
                    <tr>
                      <th>
                        {t('integrations.mailchimpSyncSettings.emailLabel')}
                      </th>
                      <th>
                        {t('integrations.mailchimpSyncSettings.errorMessage')}
                      </th>
                      <th>
                        {t('integrations.mailchimpSyncSettings.statusLabel')}
                      </th>
                      <th>
                        {t('integrations.mailchimpSyncSettings.errorDate')}
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {syncErrors.nodes.map(err => (
                      <tr key={err.id}>
                        <td>{err.email}</td>
                        <td>{err.errorMessage}</td>
                        <td>{err.statusCode ?? '-'}</td>
                        <td>
                          {new Intl.DateTimeFormat('de-CH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(err.createdAt))}
                        </td>
                        <td>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={async () => {
                              await deleteError({ variables: { id: err.id } });
                              refetchErrors();
                            }}
                          >
                            <MdDelete />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DryRunTable>
              </DryRunWrapper>

              {syncErrors.totalCount > 10 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Button
                    size="small"
                    disabled={syncErrorsSkip === 0}
                    onClick={() =>
                      setSyncErrorsSkip(Math.max(0, syncErrorsSkip - 10))
                    }
                  >
                    {t('integrations.mailchimpSyncSettings.previous')}
                  </Button>
                  <Button
                    size="small"
                    disabled={syncErrorsSkip + 10 >= syncErrors.totalCount}
                    onClick={() => setSyncErrorsSkip(syncErrorsSkip + 10)}
                  >
                    {t('integrations.mailchimpSyncSettings.next')}
                  </Button>
                </div>
              )}
            </>
          }
        </CardContent>
      )}
    </SyncCard>
  );
}
