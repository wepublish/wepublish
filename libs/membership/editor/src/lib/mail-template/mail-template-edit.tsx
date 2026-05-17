import styled from '@emotion/styled';
import {
  Alert,
  Box,
  Grid,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  FullMailProviderFragment,
  useCreateMailTemplateMutation,
  useMailTemplateContentLazyQuery,
  useMailTemplateQuery,
  useUpdateMailTemplateMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
import { analyseMailHtml, HtmlMailWarning } from './html-mail-warnings';
import { PlaceholderPicker } from './placeholder-picker';

const closePath = '/mailtemplates';

const EditorTextArea = styled('textarea')`
  width: 100%;
  min-height: 480px;
  resize: vertical;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  box-sizing: border-box;
  background-color: #fafafa;
  &:focus {
    outline: 2px solid #3498ff;
    outline-offset: -2px;
  }
`;

const PreviewFrame = styled('iframe')`
  width: 100%;
  min-height: 480px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background-color: #ffffff;
`;

const PickerPaper = styled(Paper)`
  padding: 16px;
  height: 100%;
`;

const buildPreviewHtml = (
  html: string,
  syntax: { open: string; close: string }
): string => {
  // Replace all placeholder tokens with their key in <em> for visual feedback.
  // This is a preview only — actual rendering happens server-side on send.
  const escape = (s: string) => s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = new RegExp(
    `${escape(syntax.open)}\\s*([\\w.]+)\\s*${escape(syntax.close)}`,
    'g'
  );
  return html.replace(
    pattern,
    '<em style="background:#fff3cd;padding:0 4px;border-radius:3px;color:#856404;font-style:normal;">$&</em>'
  );
};

interface MailTemplateEditProps {
  /**
   * When true, this is a create view; otherwise an existing id is read from the URL.
   */
  mode: 'create' | 'edit';
}

function MailTemplateEditView({ mode }: MailTemplateEditProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const { data: providerData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const provider: FullMailProviderFragment | undefined = providerData?.provider;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [showSource, setShowSource] = useState(true);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const [fetchTemplate, { data: contentData, loading: loadingContent }] =
    useMailTemplateContentLazyQuery({
      ...DEFAULT_QUERY_OPTIONS(),
      fetchPolicy: 'network-only',
    });

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchTemplate({ variables: { id } });
    }
  }, [mode, id, fetchTemplate]);

  useEffect(() => {
    const remote = contentData?.mailTemplate;
    if (!remote) {
      return;
    }
    setName(remote.name);
    setDescription(remote.description ?? '');
    setSubject(remote.subject ?? '');
    setHtml(remote.html ?? '');
  }, [contentData?.mailTemplate]);

  const [createTemplate, { loading: creating }] = useCreateMailTemplateMutation(
    {
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    }
  );

  const [updateTemplate, { loading: updating }] = useUpdateMailTemplateMutation(
    {
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    }
  );

  const warnings: HtmlMailWarning[] = useMemo(
    () => analyseMailHtml(html),
    [html]
  );

  const syntax = useMemo(
    () => provider?.placeholderSyntax ?? { open: '{{', close: '}}' },
    [provider?.placeholderSyntax]
  );

  const previewSrcDoc = useMemo(
    () => buildPreviewHtml(html, syntax),
    [html, syntax]
  );

  const isSubmitting = creating || updating;
  const canEditName =
    mode === 'create' || !provider?.capabilities.templateNameIsImmutable;
  const supportsSubject =
    provider?.capabilities.supportsTemplateSubject ?? true;

  const insertAtCursor = (token: string) => {
    const textarea = editorRef.current;
    if (!textarea) {
      setHtml(prev => `${prev}${token}`);
      return;
    }
    const start = textarea.selectionStart ?? html.length;
    const end = textarea.selectionEnd ?? html.length;
    const next = `${html.slice(0, start)}${token}${html.slice(end)}`;
    setHtml(next);
    // restore cursor right after the inserted token
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + token.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const handleSave = async () => {
    if (mode === 'create') {
      const result = await createTemplate({
        variables: {
          input: {
            name: name.trim(),
            html,
            subject: subject || undefined,
            description: description || undefined,
          },
        },
      });
      const created = result.data?.createMailTemplate;
      if (created?.id) {
        navigate(`/mailtemplates/edit/${created.id}`);
      }
      return;
    }

    if (!id) {
      return;
    }
    await updateTemplate({
      variables: {
        id,
        input: {
          name: canEditName ? name.trim() : undefined,
          html,
          subject: supportsSubject ? subject : undefined,
          description,
        },
      },
    });
  };

  const handleClose = () => {
    navigate(closePath);
  };

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
      >
        <ListViewContainer>
          <ListViewHeader>
            <h2>
              {mode === 'create' ?
                t('mailTemplateEdit.createTitle')
              : t('mailTemplateEdit.editTitle', { name: name || '…' })}
            </h2>
            <Typography variant="subtitle1">
              {t('mailTemplateEdit.subtitle', {
                provider: provider?.name ?? '…',
              })}
            </Typography>
          </ListViewHeader>
        </ListViewContainer>

        <Stack
          direction="row"
          gap={1}
        >
          <Button
            appearance="default"
            onClick={handleClose}
          >
            {t('mailTemplateEdit.cancel')}
          </Button>

          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={
              mode === 'create' ?
                ['CAN_CREATE_MAIL-TEMPLATES']
              : ['CAN_UPDATE_MAIL-TEMPLATES']
            }
          >
            <Button
              appearance="primary"
              loading={isSubmitting}
              disabled={!name.trim() || isSubmitting}
              onClick={handleSave}
            >
              {mode === 'create' ?
                t('mailTemplateEdit.create')
              : t('mailTemplateEdit.save')}
            </Button>
          </PermissionControl>
        </Stack>
      </Stack>

      {provider &&
        mode === 'create' &&
        !provider.capabilities.canCreateTemplates && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
          >
            {t('mailTemplateEdit.cannotCreate', { provider: provider.name })}
          </Alert>
        )}

      {mode === 'edit' && loadingContent && (
        <Alert
          severity="info"
          sx={{ mt: 2 }}
        >
          {t('mailTemplateEdit.loading')}
        </Alert>
      )}

      <Grid
        container
        spacing={2}
        sx={{ mt: 1 }}
      >
        <Grid
          item
          xs={12}
          md={8}
        >
          <Stack gap={2}>
            <TextField
              label={t('mailTemplateEdit.fieldName')}
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!canEditName}
              helperText={
                !canEditName ?
                  t('mailTemplateEdit.nameImmutable', {
                    provider: provider?.name,
                  })
                : undefined
              }
              fullWidth
              required
            />

            <TextField
              label={t('mailTemplateEdit.fieldDescription')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              helperText={t('mailTemplateEdit.descriptionHelper')}
            />

            <TextField
              label={t('mailTemplateEdit.fieldSubject')}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={!supportsSubject}
              helperText={
                !supportsSubject ?
                  t('mailTemplateEdit.subjectUnsupported', {
                    provider: provider?.name,
                  })
                : t('mailTemplateEdit.subjectHelper')
              }
              fullWidth
            />

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">
                  {t('mailTemplateEdit.bodyLabel')}
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={showSource ? 'source' : 'preview'}
                  onChange={(_, value) => {
                    if (value) {
                      setShowSource(value === 'source');
                    }
                  }}
                >
                  <ToggleButton value="source">
                    {t('mailTemplateEdit.viewSource')}
                  </ToggleButton>
                  <ToggleButton value="preview">
                    {t('mailTemplateEdit.viewPreview')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {showSource ?
                <EditorTextArea
                  ref={editorRef}
                  value={html}
                  spellCheck={false}
                  onChange={e => setHtml(e.target.value)}
                  placeholder={t('mailTemplateEdit.bodyPlaceholder')}
                />
              : <PreviewFrame
                  title="mail-template-preview"
                  sandbox=""
                  srcDoc={previewSrcDoc}
                />
              }
            </Box>

            {warnings.length > 0 && (
              <Alert severity="warning">
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1 }}
                >
                  {t('mailTemplateEdit.warningsTitle')}
                </Typography>
                <Box
                  component="ul"
                  sx={{ pl: 3, m: 0 }}
                >
                  {warnings.map(w => (
                    <li key={w.code}>
                      <strong>
                        [{t(`mailTemplateEdit.severity.${w.severity}`)}]
                      </strong>{' '}
                      {w.message}
                    </li>
                  ))}
                </Box>
              </Alert>
            )}
          </Stack>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
        >
          <PickerPaper variant="outlined">
            <PlaceholderPicker
              syntax={syntax}
              onInsert={insertAtCursor}
            />
          </PickerPaper>
        </Grid>
      </Grid>
    </>
  );
}

const CheckedCreateView = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_CREATE_MAIL-TEMPLATES',
])(() => <MailTemplateEditView mode="create" />);

const CheckedEditView = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
])(() => <MailTemplateEditView mode="edit" />);

export {
  CheckedCreateView as MailTemplateCreate,
  CheckedEditView as MailTemplateEdit,
};
