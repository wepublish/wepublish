import styled from '@emotion/styled';
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
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  DryRunMailchimpSyncMutation,
  SyncProviderSettingsDocument,
  SyncProviderSettingsQuery,
  useDeleteAllMailchimpSyncErrorsMutation,
  useDeleteMailchimpSyncErrorMutation,
  useDryRunMailchimpSyncMutation,
  useMailchimpInterestGroupsLazyQuery,
  useMailchimpListsLazyQuery,
  useMailchimpMergeFieldsLazyQuery,
  useMailchimpSyncErrorsQuery,
  useMailchimpSyncProgressQuery,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
  useSyncProviderSettingsQuery,
  useTriggerMailchimpSyncMutation,
  useUpdateSyncProviderSettingMutation,
} from '@wepublish/editor/api';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdExpandMore, MdSync } from 'react-icons/md';
import { Checkbox, Form, Loader, Message, toaster } from 'rsuite';
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
  mailchimp_mergeFieldMappings: z.array(mergeFieldMappingSchema).optional(),
  mailchimp_interestGroupMappings: z
    .array(interestGroupMappingSchema)
    .optional(),
  mailchimp_defaultInterestGroupIds: z.array(z.string()).optional(),
  mailchimp_extensions: z
    .object({
      'click-tracking': clickTrackingExtensionSchema.optional(),
    })
    .optional()
    .default({}),
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

const MappingRowLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
  max-width: 220px;
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

function parseSlugExpression(expr: string): {
  op: SlugOp;
  value: string;
} | null {
  const match = /^slug:(contains_any|contains|equals):(.*)$/.exec(expr);
  if (!match) return null;
  return { op: match[1] as SlugOp, value: match[2] };
}

function buildSlugExpression(value: string): string {
  return `slug:contains_any:${value}`;
}

function splitSlugList(value: string): string[] {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function MemberPlanMultiSelect({
  slugs,
  onChange,
  memberPlanSlugs,
}: {
  slugs: string[];
  onChange: (slugs: string[]) => void;
  memberPlanSlugs: { slug: string; name: string }[];
}) {
  const { t } = useTranslation();
  return (
    <Autocomplete
      multiple
      freeSolo
      forcePopupIcon
      openOnFocus
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
      value={slugs}
      onChange={(_, newValue) => onChange(newValue.filter(Boolean))}
      sx={{ flex: 1 }}
      renderInput={params => (
        <TextField
          {...params}
          size="small"
          placeholder={t('integrations.mailchimpSyncSettings.memberPlans')}
        />
      )}
    />
  );
}

function slugsFromExpression(expression: string | null | undefined): string[] {
  if (!expression) return [];
  const parsed = parseSlugExpression(expression);
  const exprValue = parsed?.value ?? (parsed ? '' : expression);
  return splitSlugList(exprValue);
}

type MergeFieldType =
  | 'user.firstName'
  | 'user.name'
  | 'user.id'
  | 'slug:contains'
  | 'slug:contains_any'
  | 'slug:equals'
  | 'active_abo'
  | 'active_abo_with_payment'
  | 'retarget'
  | 'static'
  | 'custom';

type UIMergeFieldType =
  | Exclude<MergeFieldType, 'slug:contains' | 'slug:equals'>
  | 'ignore';

const UI_MERGE_FIELD_TYPES: UIMergeFieldType[] = [
  'ignore',
  'user.firstName',
  'user.name',
  'user.id',
  'slug:contains_any',
  'active_abo',
  'active_abo_with_payment',
  'retarget',
  'static',
  'custom',
];

function normalizeUIMergeFieldType(type: MergeFieldType): UIMergeFieldType {
  if (type === 'slug:contains' || type === 'slug:equals') {
    return 'slug:contains_any';
  }
  return type;
}

function parseMergeFieldExpression(expr: string): {
  type: MergeFieldType;
  args: string[];
} {
  if (expr === 'user.firstName') return { type: 'user.firstName', args: [] };
  if (expr === 'user.name') return { type: 'user.name', args: [] };
  if (expr === 'user.id') return { type: 'user.id', args: [] };
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
    case 'user.id':
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
  value: string | null;
  onChange: (v: string | null) => void;
  memberPlanSlugs: { slug: string; name: string }[];
  paymentMethodSlugs: { slug: string; name: string }[];
}) {
  const { t } = useTranslation();
  const parsed = value === null ? null : parseMergeFieldExpression(value);
  const uiType: UIMergeFieldType =
    parsed ? normalizeUIMergeFieldType(parsed.type) : 'ignore';
  const args = parsed?.args ?? [];

  const handleTypeChange = (newType: UIMergeFieldType) => {
    if (newType === uiType) return;
    if (newType === 'ignore') {
      onChange(null);
      return;
    }
    onChange(buildMergeFieldExpression(newType as MergeFieldType, args));
  };

  const handleArgChange = (index: number, newValue: string) => {
    if (uiType === 'ignore') return;
    const newArgs = [...args];
    newArgs[index] = newValue;
    onChange(buildMergeFieldExpression(uiType as MergeFieldType, newArgs));
  };

  return (
    <ExpressionRow>
      <Select
        size="small"
        value={uiType}
        onChange={e => handleTypeChange(e.target.value as UIMergeFieldType)}
        sx={{ minWidth: 200 }}
      >
        {UI_MERGE_FIELD_TYPES.map(type => (
          <MenuItem
            key={type}
            value={type}
          >
            {t(
              `integrations.mailchimpSyncSettings.mf_${type.replace(':', '_')}`
            )}
          </MenuItem>
        ))}
      </Select>

      {uiType === 'slug:contains_any' && (
        <MemberPlanMultiSelect
          slugs={splitSlugList(args[0] ?? '')}
          onChange={newSlugs => handleArgChange(0, newSlugs.join(','))}
          memberPlanSlugs={memberPlanSlugs}
        />
      )}

      {uiType === 'active_abo_with_payment' && (
        <>
          <Autocomplete
            freeSolo
            forcePopupIcon
            openOnFocus
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
            value={args[0] ?? ''}
            onChange={(_, newValue) => handleArgChange(0, newValue ?? '')}
            onInputChange={(_, inputValue, reason) => {
              if (reason === 'input') {
                handleArgChange(0, inputValue);
              }
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
            value={args[1] ?? '30'}
            onChange={e => handleArgChange(1, e.target.value)}
            placeholder={t('integrations.mailchimpSyncSettings.days')}
            sx={{ width: 80 }}
          />
        </>
      )}

      {uiType === 'retarget' && (
        <TextField
          size="small"
          type="number"
          value={args[0] ?? '45'}
          onChange={e => handleArgChange(0, e.target.value)}
          placeholder={t('integrations.mailchimpSyncSettings.days')}
          sx={{ width: 100 }}
        />
      )}

      {uiType === 'static' && (
        <TextField
          size="small"
          value={args[0] ?? ''}
          onChange={e => handleArgChange(0, e.target.value)}
          placeholder={t('integrations.mailchimpSyncSettings.staticValue')}
          sx={{ flex: 1 }}
        />
      )}

      {uiType === 'custom' && (
        <TextField
          size="small"
          value={args[0] ?? ''}
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
  const memberPlanSlugs = (memberPlanData?.memberPlans?.nodes ?? []).map(p => ({
    slug: p.slug,
    name: p.name,
  }));

  const { data: paymentMethodData } = usePaymentMethodListQuery();
  const paymentMethodSlugs = (paymentMethodData?.paymentMethods ?? []).map(
    p => ({ slug: p.slug, name: p.name })
  );

  const [fetchLists, { data: listsData }] = useMailchimpListsLazyQuery();
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
    setValue,
    getValues,
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
  const watchedInterestGroupMappings = watch('mailchimp_interestGroupMappings');
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

  const watchedMergeFieldMappings = watch('mailchimp_mergeFieldMappings') ?? [];

  const setMergeFieldMapping = useCallback(
    (tag: string, expression: string | null) => {
      const current = getValues('mailchimp_mergeFieldMappings') ?? [];
      const next = current.filter(m => m.tag !== tag);
      if (expression !== null) {
        next.push({ tag, expression });
      }
      setValue('mailchimp_mergeFieldMappings', next, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const setInterestGroupMapping = useCallback(
    (groupId: string, slugs: string[]) => {
      const current = getValues('mailchimp_interestGroupMappings') ?? [];
      const next = current.filter(m => m.groupId !== groupId);
      if (slugs.length > 0) {
        next.push({
          groupId,
          expression: buildSlugExpression(slugs.join(',')),
        });
      }
      setValue('mailchimp_interestGroupMappings', next, { shouldDirty: true });
    },
    [getValues, setValue]
  );

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
        mailchimp_extensions: formData.mailchimp_extensions ?? {},
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
          </Form.Group>

          {/* List ID */}
          <Form.Group controlId={`listId-${setting.id}`}>
            <Form.ControlLabel>
              {t('integrations.mailchimpSyncSettings.listId')}
            </Form.ControlLabel>
            <Controller
              name="mailchimp_listId"
              control={control}
              render={({ field: { value, onChange } }) => {
                const knownList = availableLists.find(l => l.id === value);
                const hasUnknownValue = !!value && !knownList;
                return (
                  <Select
                    size="small"
                    fullWidth
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    displayEmpty
                    renderValue={selected => {
                      if (!selected) {
                        return (
                          <em>
                            {t('integrations.mailchimpSyncSettings.listId')}
                          </em>
                        );
                      }
                      const list = availableLists.find(l => l.id === selected);
                      return list ?
                          `${list.name} (${list.memberCount} members)`
                        : (selected as string);
                    }}
                  >
                    {hasUnknownValue && (
                      <MenuItem value={value as string}>{value}</MenuItem>
                    )}
                    {availableLists.map(list => (
                      <MenuItem
                        key={list.id}
                        value={list.id}
                      >
                        {list.name} ({list.memberCount} members)
                      </MenuItem>
                    ))}
                  </Select>
                );
              }}
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

          {(() => {
            const knownTags = new Set(availableMergeFields.map(f => f.tag));
            const orphanMappings = watchedMergeFieldMappings.filter(
              m => !knownTags.has(m.tag)
            );

            if (
              availableMergeFields.length === 0 &&
              orphanMappings.length === 0
            ) {
              return (
                <Alert
                  severity="info"
                  sx={{ mb: 1 }}
                >
                  {t(
                    'integrations.mailchimpSyncSettings.mergeFieldsRequireList'
                  )}
                </Alert>
              );
            }

            const displayRows: {
              tag: string;
              name: string;
              orphan: boolean;
            }[] = [
              ...availableMergeFields.map(f => ({
                tag: f.tag,
                name: f.name,
                orphan: false,
              })),
              ...orphanMappings.map(m => ({
                tag: m.tag,
                name: '',
                orphan: true,
              })),
            ];

            return displayRows.map(row => {
              const mapping = watchedMergeFieldMappings.find(
                m => m.tag === row.tag
              );
              const expression = mapping?.expression ?? null;
              return (
                <MappingRow key={row.tag}>
                  <MappingRowLabel>
                    <strong>{row.tag}</strong>
                    {row.name && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="span"
                      >
                        {row.name}
                      </Typography>
                    )}
                    {row.orphan && (
                      <Chip
                        label={t(
                          'integrations.mailchimpSyncSettings.orphanField'
                        )}
                        color="warning"
                        size="small"
                      />
                    )}
                  </MappingRowLabel>
                  <MergeFieldExpressionEditor
                    value={expression}
                    onChange={newValue =>
                      setMergeFieldMapping(row.tag, newValue)
                    }
                    memberPlanSlugs={memberPlanSlugs}
                    paymentMethodSlugs={paymentMethodSlugs}
                  />
                </MappingRow>
              );
            });
          })()}

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

          {(() => {
            const knownIds = new Set(availableInterestGroups.map(g => g.id));
            const orphanMappings = (watchedInterestGroupMappings ?? []).filter(
              m => !knownIds.has(m.groupId)
            );

            if (
              availableInterestGroups.length === 0 &&
              orphanMappings.length === 0
            ) {
              return (
                <Alert
                  severity="info"
                  sx={{ mb: 1 }}
                >
                  {t(
                    'integrations.mailchimpSyncSettings.interestGroupsRequireList'
                  )}
                </Alert>
              );
            }

            const displayRows: {
              id: string;
              name: string;
              orphan: boolean;
            }[] = [
              ...availableInterestGroups.map(g => ({
                id: g.id,
                name: g.name,
                orphan: false,
              })),
              ...orphanMappings.map(m => ({
                id: m.groupId,
                name: '',
                orphan: true,
              })),
            ];

            return displayRows.map(row => {
              const mapping = (watchedInterestGroupMappings ?? []).find(
                m => m.groupId === row.id
              );
              const slugs = slugsFromExpression(mapping?.expression);
              return (
                <MappingRow key={row.id}>
                  <MappingRowLabel>
                    <strong>{row.name || row.id}</strong>
                    {row.name && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="span"
                      >
                        {row.id}
                      </Typography>
                    )}
                    {row.orphan && (
                      <Chip
                        label={t(
                          'integrations.mailchimpSyncSettings.orphanField'
                        )}
                        color="warning"
                        size="small"
                      />
                    )}
                  </MappingRowLabel>
                  <MemberPlanMultiSelect
                    slugs={slugs}
                    onChange={newSlugs =>
                      setInterestGroupMapping(row.id, newSlugs)
                    }
                    memberPlanSlugs={memberPlanSlugs}
                  />
                </MappingRow>
              );
            });
          })()}

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
                    forcePopupIcon
                    openOnFocus
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
                        ...(watchedInterestGroupMappings ?? [])
                          .map((m: { groupId: string }) => m.groupId)
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
