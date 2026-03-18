import { gql, useMutation, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSync } from 'react-icons/md';
import { Checkbox, Form, Input, Loader, Message, toaster } from 'rsuite';
import { z } from 'zod';

import mailChimpLogo from './assets/mailchimp.webp';

const SyncProviderSettingsDocument = gql`
  query SyncProviderSettings {
    syncProviderSettings {
      id
      createdAt
      modifiedAt
      lastLoadedAt
      type
      name
      enabled
      mailchimp_listId
      mailchimp_mergeFieldMappings
      mailchimp_interestGroupMappings
      mailchimp_defaultInterestGroupIds
      lastSyncAt
      lastSyncError
    }
  }
`;

const UpdateSyncProviderSettingDocument = gql`
  mutation UpdateSyncProviderSetting(
    $id: String!
    $name: String
    $enabled: Boolean
    $mailchimp_apiKey: String
    $mailchimp_listId: String
    $mailchimp_mergeFieldMappings: [JSONObject!]
    $mailchimp_interestGroupMappings: [JSONObject!]
    $mailchimp_defaultInterestGroupIds: [String!]
  ) {
    updateSyncProviderSetting(
      id: $id
      name: $name
      enabled: $enabled
      mailchimp_apiKey: $mailchimp_apiKey
      mailchimp_listId: $mailchimp_listId
      mailchimp_mergeFieldMappings: $mailchimp_mergeFieldMappings
      mailchimp_interestGroupMappings: $mailchimp_interestGroupMappings
      mailchimp_defaultInterestGroupIds: $mailchimp_defaultInterestGroupIds
    ) {
      id
      createdAt
      modifiedAt
      lastLoadedAt
      type
      name
      enabled
      mailchimp_listId
      mailchimp_mergeFieldMappings
      mailchimp_interestGroupMappings
      mailchimp_defaultInterestGroupIds
      lastSyncAt
      lastSyncError
    }
  }
`;

const TriggerMailchimpSyncDocument = gql`
  mutation TriggerMailchimpSync($id: String!) {
    triggerMailchimpSync(id: $id)
  }
`;

const DryRunMailchimpSyncDocument = gql`
  mutation DryRunMailchimpSync($id: String!) {
    dryRunMailchimpSync(id: $id) {
      updatedCount
      skippedCount
      changes {
        email
        isNew
        mergeFields
        interests
        previousMergeFields
        previousInterests
      }
    }
  }
`;

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

export function MailchimpSyncIntegrationForm() {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery(SyncProviderSettingsDocument);

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
      {settings.map((setting: any) => (
        <SyncProviderSettingCard
          key={setting.id}
          setting={setting}
        />
      ))}
    </>
  );
}

interface DryRunChange {
  email: string;
  isNew: boolean;
  mergeFields: Record<string, string>;
  interests: Record<string, boolean>;
  previousMergeFields: Record<string, string> | null;
  previousInterests: Record<string, boolean> | null;
}

interface DryRunResultData {
  updatedCount: number;
  skippedCount: number;
  changes: DryRunChange[];
}

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

function SyncProviderSettingCard({ setting }: { setting: any }) {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResultData | null>(
    null
  );

  const [updateSettings, { loading: updating }] = useMutation(
    UpdateSyncProviderSettingDocument,
    { refetchQueries: [{ query: SyncProviderSettingsDocument }] }
  );

  const [triggerSync] = useMutation(TriggerMailchimpSyncDocument);
  const [dryRunSync] = useMutation(DryRunMailchimpSyncDocument);

  const { control, handleSubmit } = useForm<SyncProviderFormValues>({
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

  const onSubmit = handleSubmit(async formData => {
    try {
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
      toaster.push(
        <Message type="success">{t('integrations.updateSuccess')}</Message>
      );
    } catch (e) {
      toaster.push(
        <Message type="error">{t('integrations.updateError')}</Message>
      );
      console.error(e);
    }
  });

  const handleTriggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      await triggerSync({ variables: { id: setting.id } });
      toaster.push(
        <Message type="success">
          {t('integrations.mailchimpSyncSettings.syncTriggered')}
        </Message>
      );
    } catch (e) {
      toaster.push(
        <Message type="error">
          {t('integrations.mailchimpSyncSettings.syncFailed')}
        </Message>
      );
      console.error(e);
    } finally {
      setSyncing(false);
    }
  }, [triggerSync, setting.id, t]);

  const handleDryRun = useCallback(async () => {
    setDryRunning(true);
    setDryRunResult(null);
    try {
      const { data } = await dryRunSync({
        variables: { id: setting.id },
      });
      setDryRunResult(data?.dryRunMailchimpSync ?? null);
    } catch (e) {
      toaster.push(
        <Message type="error">
          {t('integrations.mailchimpSyncSettings.syncFailed')}
        </Message>
      );
      console.error(e);
    } finally {
      setDryRunning(false);
    }
  }, [dryRunSync, setting.id, t]);

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
              render={({ field: { value, onChange, ...rest } }) => (
                <Form.Control
                  value={value ?? ''}
                  onChange={onChange}
                  {...rest}
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
          >
            {t('integrations.mailchimpSyncSettings.mergeFieldHelp')}
          </Typography>

          {mergeFields.map((field, index) => (
            <MappingRow key={field.id}>
              <Controller
                name={`mailchimp_mergeFieldMappings.${index}.tag`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <MappingInput
                    value={value}
                    onChange={onChange}
                    placeholder={t(
                      'integrations.mailchimpSyncSettings.mergeFieldTag'
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
          >
            {t('integrations.mailchimpSyncSettings.interestGroupHelp')}
          </Typography>

          {interestFields.map((field, index) => (
            <MappingRow key={field.id}>
              <Controller
                name={`mailchimp_interestGroupMappings.${index}.groupId`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <MappingInput
                    value={value}
                    onChange={onChange}
                    placeholder={t(
                      'integrations.mailchimpSyncSettings.interestGroupId'
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
