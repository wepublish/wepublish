import styled from '@emotion/styled';
import {
  DryRunMailchimpSyncMutation,
  MailchimpSyncErrorsDocument,
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
  usePaymentMethodListQuery,
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
  LinearProgress,
  MenuItem,
  Select,
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

const ExpressionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
`;

type SlugOp = 'contains' | 'contains_any' | 'equals';

const INTEREST_OPS: SlugOp[] = ['contains', 'equals', 'contains_any'];

function parseSlugExpression(expr: string): {
  op: SlugOp;
  value: string;
} | null {
  const match = /^slug:(contains_any|contains|equals):(.*)$/.exec(expr);
  if (!match) return null;
  return { op: match[1] as SlugOp, value: match[2] };
}

function buildSlugExpression(op: SlugOp, value: string): string {
  return `slug:${op}:${value}`;
}

function InterestExpressionEditor({
  value,
  onChange,
  memberPlanSlugs,
}: {
  value: string;
  onChange: (v: string) => void;
  memberPlanSlugs: { slug: string; name: string }[];
}) {
  const { t } = useTranslation();
  const parsed = parseSlugExpression(value);
  const op = parsed?.op ?? 'contains';
  const exprValue = parsed?.value ?? (parsed ? '' : value);

  return (
    <ExpressionRow>
      <Select
        size="small"
        value={op}
        onChange={e => {
          onChange(buildSlugExpression(e.target.value as SlugOp, exprValue));
        }}
        sx={{ minWidth: 140 }}
      >
        {INTEREST_OPS.map(o => (
          <MenuItem
            key={o}
            value={o}
          >
            {t(`integrations.mailchimpSyncSettings.op_${o}`)}
          </MenuItem>
        ))}
      </Select>

      {op === 'equals' ?
        <Autocomplete
          freeSolo
          options={memberPlanSlugs.map(p => p.slug)}
          getOptionLabel={slug => {
            const plan = memberPlanSlugs.find(p => p.slug === slug);
            return plan ? `${plan.name} (${plan.slug})` : slug;
          }}
          filterOptions={(options, { inputValue }) =>
            inputValue ?
              options.filter(slug => {
                const plan = memberPlanSlugs.find(p => p.slug === slug);
                const label = plan ? `${plan.name} ${plan.slug}` : slug;
                return label.toLowerCase().includes(inputValue.toLowerCase());
              })
            : options
          }
          value={exprValue}
          onChange={(_, newValue) => {
            onChange(buildSlugExpression(op, newValue ?? ''));
          }}
          onInputChange={(_, inputValue, reason) => {
            if (reason === 'input')
              onChange(buildSlugExpression(op, inputValue));
          }}
          sx={{ flex: 1 }}
          renderInput={params => (
            <TextField
              {...params}
              size="small"
              placeholder="Slug"
            />
          )}
        />
      : <TextField
          size="small"
          value={exprValue}
          onChange={e => onChange(buildSlugExpression(op, e.target.value))}
          placeholder={
            op === 'contains_any' ?
              t('integrations.mailchimpSyncSettings.containsAnyPlaceholder')
            : 'Slug'
          }
          sx={{ flex: 1 }}
        />
      }
    </ExpressionRow>
  );
}

type MergeFieldType =
  | 'user.firstName'
  | 'user.name'
  | 'slug:contains'
  | 'slug:contains_any'
  | 'slug:equals'
  | 'active_abo'
  | 'active_abo_with_payment'
  | 'retarget'
  | 'static'
  | 'custom';

const MERGE_FIELD_TYPES: MergeFieldType[] = [
  'user.firstName',
  'user.name',
  'slug:contains',
  'slug:contains_any',
  'slug:equals',
  'active_abo',
  'active_abo_with_payment',
  'retarget',
  'static',
  'custom',
];

function parseMergeFieldExpression(expr: string): {
  type: MergeFieldType;
  args: string[];
} {
  if (expr === 'user.firstName') return { type: 'user.firstName', args: [] };
  if (expr === 'user.name') return { type: 'user.name', args: [] };
  if (expr === 'active_abo') return { type: 'active_abo', args: [] };

  const slugMatch = /^slug:(contains_any|contains|equals):(.*)$/.exec(expr);
  if (slugMatch)
    return {
      type: `slug:${slugMatch[1]}` as MergeFieldType,
      args: [slugMatch[2]],
    };

  const aboPayMatch = /^active_abo_with_payment:([^:]*):(.*)$/.exec(expr);
  if (aboPayMatch)
    return {
      type: 'active_abo_with_payment',
      args: [aboPayMatch[1], aboPayMatch[2]],
    };

  const retargetMatch = /^retarget:(.*)$/.exec(expr);
  if (retargetMatch) return { type: 'retarget', args: [retargetMatch[1]] };

  const staticMatch = /^static:(.*)$/.exec(expr);
  if (staticMatch) return { type: 'static', args: [staticMatch[1]] };

  return { type: 'custom', args: [expr] };
}

function buildMergeFieldExpression(
  type: MergeFieldType,
  args: string[]
): string {
  switch (type) {
    case 'user.firstName':
    case 'user.name':
    case 'active_abo':
      return type;
    case 'slug:contains':
    case 'slug:contains_any':
    case 'slug:equals':
      return `${type}:${args[0] ?? ''}`;
    case 'active_abo_with_payment':
      return `active_abo_with_payment:${args[0] ?? ''}:${args[1] ?? '30'}`;
    case 'retarget':
      return `retarget:${args[0] ?? '45'}`;
    case 'static':
      return `static:${args[0] ?? ''}`;
    case 'custom':
      return args[0] ?? '';
  }
}

function MergeFieldExpressionEditor({
  value,
  onChange,
  memberPlanSlugs,
  paymentMethodSlugs,
}: {
  value: string;
  onChange: (v: string) => void;
  memberPlanSlugs: { slug: string; name: string }[];
  paymentMethodSlugs: { slug: string; name: string }[];
}) {
  const { t } = useTranslation();
  const parsed = parseMergeFieldExpression(value);

  const handleTypeChange = (newType: MergeFieldType) => {
    if (newType === parsed.type) return;
    onChange(buildMergeFieldExpression(newType, parsed.args));
  };

  const handleArgChange = (index: number, newValue: string) => {
    const newArgs = [...parsed.args];
    newArgs[index] = newValue;
    onChange(buildMergeFieldExpression(parsed.type, newArgs));
  };

  return (
    <ExpressionRow>
      <Select
        size="small"
        value={parsed.type}
        onChange={e => handleTypeChange(e.target.value as MergeFieldType)}
        sx={{ minWidth: 180 }}
      >
        {MERGE_FIELD_TYPES.map(type => (
          <MenuItem
            key={type}
            value={type}
          >
            {t(`integrations.mailchimpSyncSettings.mf_${type}`)}
          </MenuItem>
        ))}
      </Select>

      {parsed.type === 'slug:equals' && (
        <Autocomplete
          freeSolo
          options={memberPlanSlugs.map(p => p.slug)}
          getOptionLabel={slug => {
            const plan = memberPlanSlugs.find(p => p.slug === slug);
            return plan ? `${plan.name} (${plan.slug})` : slug;
          }}
          filterOptions={(options, { inputValue }) =>
            inputValue ?
              options.filter(slug => {
                const plan = memberPlanSlugs.find(p => p.slug === slug);
                const label = plan ? `${plan.name} ${plan.slug}` : slug;
                return label.toLowerCase().includes(inputValue.toLowerCase());
              })
            : options
          }
          value={parsed.args[0] ?? ''}
          onChange={(_, newValue) => handleArgChange(0, newValue ?? '')}
          onInputChange={(_, inputValue, reason) => {
            if (reason === 'input') handleArgChange(0, inputValue);
          }}
          sx={{ flex: 1 }}
          renderInput={params => (
            <TextField
              {...params}
              size="small"
              placeholder="Slug"
            />
          )}
        />
      )}

      {(parsed.type === 'slug:contains' ||
        parsed.type === 'slug:contains_any') && (
        <TextField
          size="small"
          value={parsed.args[0] ?? ''}
          onChange={e => handleArgChange(0, e.target.value)}
          placeholder={
            parsed.type === 'slug:contains_any' ?
              t('integrations.mailchimpSyncSettings.containsAnyPlaceholder')
            : 'Slug'
          }
          sx={{ flex: 1 }}
        />
      )}

      {parsed.type === 'active_abo_with_payment' && (
        <>
          <Autocomplete
            freeSolo
            options={paymentMethodSlugs.map(p => p.slug)}
            getOptionLabel={slug => {
              const pm = paymentMethodSlugs.find(p => p.slug === slug);
              return pm ? `${pm.name} (${pm.slug})` : slug;
            }}
            filterOptions={(options, { inputValue }) =>
              inputValue ?
                options.filter(slug => {
                  const pm = paymentMethodSlugs.find(p => p.slug === slug);
                  const label = pm ? `${pm.name} ${pm.slug}` : slug;
                  return label.toLowerCase().includes(inputValue.toLowerCase());
                })
              : options
            }
            value={parsed.args[0] ?? ''}
            onChange={(_, newValue) => handleArgChange(0, newValue ?? '')}
            onInputChange={(_, inputValue, reason) => {
              if (reason === 'input') handleArgChange(0, inputValue);
            }}
            sx={{ flex: 1 }}
            renderInput={params => (
              <TextField
                {...params}
                size="small"
                placeholder={t(
                  'integrations.mailchimpSyncSettings.paymentMethodSlug'
                )}
              />
            )}
          />
          <TextField
            size="small"
            type="number"
            value={parsed.args[1] ?? '30'}
            onChange={e => handleArgChange(1, e.target.value)}
            placeholder={t('integrations.mailchimpSyncSettings.days')}
            sx={{ width: 80 }}
          />
        </>
      )}

      {parsed.type === 'retarget' && (
        <TextField
          size="small"
          type="number"
          value={parsed.args[0] ?? '45'}
          onChange={e => handleArgChange(0, e.target.value)}
          placeholder={t('integrations.mailchimpSyncSettings.days')}
          sx={{ width: 100 }}
        />
      )}

      {parsed.type === 'static' && (
        <TextField
          size="small"
          value={parsed.args[0] ?? ''}
          onChange={e => handleArgChange(0, e.target.value)}
          placeholder={t('integrations.mailchimpSyncSettings.staticValue')}
          sx={{ flex: 1 }}
        />
      )}

      {parsed.type === 'custom' && (
        <TextField
          size="small"
          value={parsed.args[0] ?? ''}
          onChange={e => handleArgChange(0, e.target.value)}
          placeholder={t(
            'integrations.mailchimpSyncSettings.mergeFieldExpression'
          )}
          sx={{ flex: 1 }}
        />
      )}
    </ExpressionRow>
  );
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
  const memberPlanSlugs = (memberPlanData?.memberPlans?.nodes ?? []).map(p => ({
    slug: p.slug,
    name: p.name,
  }));

  const { data: paymentMethodData } = usePaymentMethodListQuery();
  const paymentMethodSlugs = (paymentMethodData?.paymentMethods ?? []).map(
    p => ({ slug: p.slug, name: p.name })
  );

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
                  <MergeFieldExpressionEditor
                    value={value}
                    onChange={onChange}
                    memberPlanSlugs={memberPlanSlugs}
                    paymentMethodSlugs={paymentMethodSlugs}
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
                  <InterestExpressionEditor
                    value={value}
                    onChange={onChange}
                    memberPlanSlugs={memberPlanSlugs}
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
            onClick={() =>
              appendInterestGroup({
                groupId: '',
                expression: 'slug:contains:',
              })
            }
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
            disabled={dryRunning || !setting.enabled}
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
                      <th>Email</th>
                      <th>
                        {t('integrations.mailchimpSyncSettings.errorMessage')}
                      </th>
                      <th>Status</th>
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
