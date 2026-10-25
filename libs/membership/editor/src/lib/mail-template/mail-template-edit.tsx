import { useLazyQuery, useMutation } from '@apollo/client/react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useApolloClient } from '@apollo/client/react';
import {
  CreateMailTemplateDocument,
  MailTemplateByIdDocument,
  MailTemplateContext,
  MailTemplatePreviewDocument,
  MailTemplatePreviewInput,
  MailTemplatePreviewQuery,
  MailTemplatePreviewQueryVariables,
  MailTemplateSubscriptionsDocument,
  SendTestMailTemplateDocument,
  UpdateMailTemplateDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  enqueueSnackbar,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import { FieldLabel } from '../field-label';
import { HtmlSourceEditor, HtmlSourceEditorHandle } from './html-source-editor';
import { HtmlVisualEditor, HtmlVisualEditorHandle } from './html-visual-editor';
import {
  applyShellSettings,
  createEmptyEmailHtml,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_CONTENT_WIDTH,
  jwtInsertionFor,
  readShellSettings,
} from './mail-html';
import { MailColorPicker } from './color-picker';
import { MailPreview } from './mail-preview';
import { MAIL_PLACEHOLDER_CONTEXTS } from './mail-placeholders';
import { PlaceholderPicker } from './placeholder-picker';
import {
  CanCreateMailTemplates,
  CanGetMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';

// Derive a plain-text fallback from the HTML body: links become "label (url)",
// block elements become line breaks, remaining tags/styles are stripped.
const deriveTextFromHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('.mail-body') ?? doc.body;
  root.querySelectorAll('a[href]').forEach(anchor => {
    const href = anchor.getAttribute('href') ?? '';
    const label = (anchor.textContent ?? '').trim();
    anchor.replaceWith(label && label !== href ? `${label} (${href})` : href);
  });
  root.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  root.querySelectorAll('p,div,h1,h2,h3,li,tr').forEach(el => el.append('\n'));
  return (root.textContent ?? '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const JWT_TOKEN = '{{jwt}}';

/**
 * The login token is only useful as a query parameter, so inserting it right
 * after a URL writes the whole `?jwt={{jwt}}` / `&jwt={{jwt}}` for the author.
 * Every other placeholder is inserted verbatim.
 */
const resolveToken = (token: string, textBeforeCaret: string): string =>
  token === JWT_TOKEN ? jwtInsertionFor(textBeforeCaret) : token;

function MailTemplateEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [textContent, setTextContent] = useState('');
  const [bodyMode, setBodyMode] = useState<'visual' | 'html' | 'text'>(
    'visual'
  );
  const [backgroundColor, setBackgroundColor] = useState(
    DEFAULT_BACKGROUND_COLOR
  );
  const [contentWidth, setContentWidth] = useState(DEFAULT_CONTENT_WIDTH);
  const [editorKey, setEditorKey] = useState(0);
  const [activeField, setActiveField] = useState<'subject' | 'body'>('body');
  const [nameError, setNameError] = useState(false);
  const [purposeError, setPurposeError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const purposeRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const ids = {
    purpose: `${fieldId}-purpose`,
    name: `${fieldId}-name`,
    description: `${fieldId}-description`,
    subject: `${fieldId}-subject`,
    sample: `${fieldId}-sample`,
    background: `${fieldId}-background`,
    width: `${fieldId}-width`,
    bodyMode: `${fieldId}-body-mode`,
  };

  // The canonical HTML lives in a ref so typing never re-renders the page
  // (which would reset the iframe/CodeMirror cursor).
  const htmlRef = useRef<string>(createEmptyEmailHtml());
  const visualRef = useRef<HtmlVisualEditorHandle>(null);
  const sourceRef = useRef<HtmlSourceEditorHandle>(null);

  // Preview / test state
  // The mail type must be chosen explicitly so preview/test use the data a real
  // mail of that type would carry (more realistic than a generic dump).
  const [contextId, setContextId] = useState<MailTemplateContext | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState('');

  const [loadTemplate] = useLazyQuery(MailTemplateByIdDocument, {
    fetchPolicy: 'network-only',
  });
  const [createMailTemplate] = useMutation(
    CreateMailTemplateDocument,
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [updateMailTemplate] = useMutation(
    UpdateMailTemplateDocument,
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const client = useApolloClient();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendTest, { loading: testLoading }] = useMutation(
    SendTestMailTemplateDocument,
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [searchSubscriptions, { data: subscriptionData }] = useLazyQuery(
    MailTemplateSubscriptionsDocument
  );

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    loadTemplate({ variables: { id } }).then(({ data }) => {
      const template = data?.mailTemplate;
      if (!template) {
        return;
      }
      setName(template.name);
      setDescription(template.description ?? '');
      setSubject(template.subject);
      setTextContent(template.textContent ?? '');
      setContextId(template.context ?? null);
      htmlRef.current = template.htmlContent || createEmptyEmailHtml();
      const shell = readShellSettings(htmlRef.current);
      setBackgroundColor(shell.backgroundColor);
      setContentWidth(shell.contentWidth);
      setEditorKey(k => k + 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleHtmlChange = (html: string) => {
    htmlRef.current = html;
  };

  // Rewrite the gray frame color / content width on the current shell and
  // remount the editor so the change is visible immediately.
  const applyShell = (
    next: Partial<{ backgroundColor: string; contentWidth: number }>
  ) => {
    const settings = { backgroundColor, contentWidth, ...next };
    setBackgroundColor(settings.backgroundColor);
    setContentWidth(settings.contentWidth);
    htmlRef.current = applyShellSettings(htmlRef.current, settings);
    setEditorKey(k => k + 1);
  };

  const switchMode = (mode: 'visual' | 'html' | 'text') => {
    if (mode === bodyMode) {
      return;
    }
    // The plain-text tab is read-only and auto-generated: refresh it from the
    // current HTML every time it's opened.
    if (mode === 'text') {
      setTextContent(deriveTextFromHtml(htmlRef.current));
    }
    // Both editors bind the same canonical string; remounting the target with
    // the latest HTML keeps the switch lossless.
    setBodyMode(mode);
    setEditorKey(k => k + 1);
  };

  const insertToken = (token: string) => {
    if (activeField === 'subject') {
      // The caret is always at the end here, so the subject itself is the
      // context the login token is judged against.
      setSubject(prev => prev + resolveToken(token, prev));
      return;
    }
    if (bodyMode === 'visual') {
      // A link's href is not text the caret can sit in, so for the login token
      // try the link under the caret first — same behaviour as the button in
      // the link dialog. Only plain text falls through to an insertion.
      if (token === JWT_TOKEN && visualRef.current?.appendJwtToCurrentLink()) {
        return;
      }

      const text = resolveToken(
        token,
        visualRef.current?.textBeforeCaret() ?? ''
      );

      if (text) {
        visualRef.current?.insertToken(text);
      }
    } else if (bodyMode === 'html') {
      const text = resolveToken(
        token,
        sourceRef.current?.textBeforeCaret() ?? ''
      );

      if (text) {
        sourceRef.current?.insertText(text);
      }
    }
    // The text tab is read-only — nothing to insert into.
  };

  const buildInput = () => ({
    name,
    description,
    subject,
    htmlContent: htmlRef.current,
    // The text fallback is always regenerated from the HTML on save.
    textContent: deriveTextFromHtml(htmlRef.current),
    context: contextId,
  });

  const save = async (close: boolean) => {
    setNameError(!name);
    setPurposeError(!contextId);

    if (!name) {
      nameInputRef.current?.focus();
      enqueueSnackbar(t('mailTemplates.edit.nameRequired'), {
        variant: 'error',
      });
      return;
    }
    // The mail type is enforced on save (existing null-type templates still
    // load, but can't be saved again without choosing one).
    if (!contextId) {
      purposeRef.current?.focus();
      enqueueSnackbar(
        t(
          'mailTemplates.edit.selectMailType',
          'Please choose a purpose first.'
        ),
        { variant: 'error' }
      );
      return;
    }
    if (isEdit) {
      await updateMailTemplate({ variables: { id: id!, input: buildInput() } });
    } else {
      const result = await createMailTemplate({
        variables: { input: buildInput() },
      });
      const newId = result.data?.createMailTemplate.id;
      if (newId && !close) {
        navigate(`/mailtemplates/edit/${newId}`);
        return;
      }
    }
    if (close) {
      navigate('/mailtemplates');
    }
  };

  const previewInput = (ctx: string): MailTemplatePreviewInput => ({
    contextId: ctx,
    subscriptionId,
    subject,
    htmlContent: htmlRef.current,
    textContent,
  });

  // Preview/test never block on a missing mail type: fall back to `custom`
  // (user data only) so any template can be checked. Picking a mail type gives
  // a more accurate preview with that context's sample data.
  const effectiveContext = (): MailTemplateContext =>
    contextId ?? MailTemplateContext.Custom;

  const doPreview = async () => {
    const ctx = effectiveContext();
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const { data, error } = await client.query<
        MailTemplatePreviewQuery,
        MailTemplatePreviewQueryVariables
      >({
        query: MailTemplatePreviewDocument,
        variables: { input: previewInput(ctx) },
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      });
      if (error) {
        throw error;
      }
      setPreviewSubject(data!.mailTemplatePreview.subject);
      setPreviewHtml(data!.mailTemplatePreview.html);
      setPreviewOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPreviewError(message);
      setPreviewHtml(null);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const doSendTest = async () => {
    const ctx = effectiveContext();
    await sendTest({
      variables: {
        input: previewInput(ctx),
      },
    });
    enqueueSnackbar(t('mailTemplates.edit.testSent'), { variant: 'success' });
  };

  const contextOptions = MAIL_PLACEHOLDER_CONTEXTS.map(c => ({
    label: t(c.titleKey, c.title),
    description: t(`mailTemplates.purposeDescriptions.${c.id}`),
    value: c.id,
  }));

  return (
    <div style={{ flexShrink: 0 }}>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {isEdit ?
              t('mailTemplates.edit.editHeader')
            : t('mailTemplates.edit.createHeader')}
          </PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            variant="text"
            onClick={() => navigate('/mailtemplates')}
          >
            {t('mailTemplates.cancel')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => save(false)}
          >
            {t('mailTemplates.save')}
          </Button>
          <Button
            variant="contained"
            onClick={() => save(true)}
          >
            {t('mailTemplates.edit.saveAndClose')}
          </Button>
        </ListViewActions>
      </ListViewContainer>
      {/* The two tiles stick together as one header row so the preview
          controls stay reachable while scrolling the editor. */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'stretch',
          marginTop: 16,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--mui-palette-background-default)',
        }}
      >
        <Card
          variant="outlined"
          sx={{
            flex: 1,
            minWidth: 'min(360px, 100%)',
            bgcolor: 'background.paper',
          }}
        >
          <CardHeader
            title={t('mailTemplates.edit.details', 'Details')}
            slotProps={{ title: { component: 'h2' } }}
          />

          <CardContent>
            <Stack
              spacing={3}
              sx={{ width: '100%' }}
            >
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <FormControl
                  style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                  fullWidth
                >
                  <FieldLabel
                    id={ids.purpose}
                    label={t('mailTemplates.edit.mailType')}
                    help={t('mailTemplates.edit.purposeHint')}
                    required
                  />
                  <TextField
                    select
                    required
                    value={contextId ?? ''}
                    onChange={event => {
                      setPurposeError(false);
                      setContextId(
                        (event.target.value as MailTemplateContext) || null
                      );
                    }}
                    inputRef={purposeRef}
                    error={purposeError}
                    helperText={
                      purposeError ?
                        t('mailTemplates.edit.selectMailType')
                      : undefined
                    }
                    slotProps={{
                      select: {
                        displayEmpty: true,
                        labelId: ids.purpose,
                      },
                    }}
                    fullWidth
                  >
                    <MenuItem value="">
                      {t(
                        'mailTemplates.edit.selectMailTypePlaceholder',
                        'Choose a purpose …'
                      )}
                    </MenuItem>

                    {contextOptions.map(option => (
                      <MenuItem
                        key={option.value}
                        value={option.value}
                        sx={{ display: 'block', paddingBlock: 0.5 }}
                      >
                        <div>{option.label}</div>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            whiteSpace: 'normal',
                            lineHeight: 1.35,
                          }}
                        >
                          {(option as { description?: string }).description}
                        </Typography>
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
                <FormControl
                  style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                  fullWidth
                >
                  <FieldLabel
                    id={ids.name}
                    label={t('mailTemplates.name')}
                    required
                  />
                  <TextField
                    value={name}
                    required
                    inputRef={nameInputRef}
                    onChange={event => {
                      setNameError(false);
                      setName(event.target.value);
                    }}
                    error={nameError}
                    helperText={
                      nameError ?
                        t('mailTemplates.edit.nameRequired')
                      : undefined
                    }
                    slotProps={{
                      htmlInput: { 'aria-labelledby': ids.name },
                    }}
                  />
                </FormControl>
                <FormControl
                  style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                  fullWidth
                >
                  <FieldLabel
                    id={ids.description}
                    label={t('mailTemplates.description')}
                    help={t('mailTemplates.edit.descriptionHelp')}
                  />
                  <TextField
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    slotProps={{
                      htmlInput: { 'aria-labelledby': ids.description },
                    }}
                  />
                </FormControl>
                <FormControl
                  style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                  fullWidth
                >
                  <FieldLabel
                    id={ids.subject}
                    label={t('mailTemplates.subject')}
                  />
                  <TextField
                    value={subject}
                    onChange={event => setSubject(event.target.value)}
                    onFocus={() => setActiveField('subject')}
                    slotProps={{
                      htmlInput: { 'aria-labelledby': ids.subject },
                    }}
                  />
                </FormControl>
              </div>
            </Stack>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            flex: 1,
            minWidth: 'min(360px, 100%)',
            bgcolor: 'background.paper',
          }}
        >
          <CardHeader
            title={t('mailTemplates.edit.previewAndTest')}
            slotProps={{ title: { component: 'h2' } }}
          />

          <CardContent>
            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <FieldLabel
                  id={ids.sample}
                  label={t('mailTemplates.edit.sampleSubscription')}
                  help={t('mailTemplates.edit.sampleSubscriptionHelp')}
                />
                <Autocomplete
                  options={(
                    subscriptionData?.mailTemplateSubscriptions ?? []
                  ).map(subscription => subscription.id)}
                  getOptionLabel={id =>
                    (subscriptionData?.mailTemplateSubscriptions ?? []).find(
                      subscription => subscription.id === id
                    )?.label ?? id
                  }
                  filterOptions={options => options}
                  value={subscriptionId}
                  onChange={(_event, id) => setSubscriptionId(id)}
                  onInputChange={(_event, query, reason) => {
                    if (reason === 'input') {
                      searchSubscriptions({ variables: { query } });
                    }
                  }}
                  onOpen={() => searchSubscriptions({ variables: {} })}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder={t('mailTemplates.edit.sampleDataFallback')}
                      slotProps={{
                        ...params.slotProps,
                        htmlInput: {
                          ...params.slotProps.htmlInput,
                          'aria-labelledby': ids.sample,
                        },
                      }}
                    />
                  )}
                />
              </div>
              <Stack
                direction="row"
                spacing={1}
              >
                <Button
                  variant="contained"
                  loading={previewLoading}
                  onClick={doPreview}
                >
                  {t('mailTemplates.edit.preview')}
                </Button>
                <Button
                  variant="outlined"
                  loading={testLoading}
                  onClick={doSendTest}
                >
                  {t('mailTemplates.edit.sendTest')}
                </Button>
              </Stack>
            </div>

            <Typography
              variant="caption"
              style={{ marginTop: 8, color: 'text.secondary' }}
              sx={{
                display: 'block',
              }}
            >
              {t(
                'mailTemplates.edit.testRecipientHint',
                'Test mails are always sent to your own account.'
              )}
            </Typography>

            {previewError && (
              <Alert
                severity="error"
                style={{ marginTop: 16 }}
              >
                {previewError}
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          marginTop: 2,
          alignItems: 'stretch',
        }}
      >
        {/* Bounded to the editor column's height: the picker is absolutely
            positioned so it never grows the row, and scrolls internally. */}
        <Box
          sx={{
            width: { xs: '100%', md: 320 },
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: { xs: 'static', md: 'absolute' },
              inset: 0,
              maxHeight: { xs: 360, md: 'none' },
              overflowY: 'auto',
            }}
          >
            <PlaceholderPicker
              onInsert={insertToken}
              context={contextId}
            />
          </Box>
        </Box>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            useFlexGap
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
            spacing={1}
            style={{ marginBottom: 8 }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'center' }}
              spacing={1}
            >
              <ButtonGroup
                size="small"
                aria-label={t('mailTemplates.edit.bodyMode')}
              >
                {(
                  [
                    ['visual', t('mailTemplates.wysiwyg')],
                    ['html', t('mailTemplates.rawHtml')],
                    ['text', t('mailTemplates.textContent')],
                  ] as const
                ).map(([mode, label]) => (
                  <Button
                    key={mode}
                    variant={bodyMode === mode ? 'contained' : 'outlined'}
                    aria-pressed={bodyMode === mode}
                    onClick={() => switchMode(mode)}
                  >
                    {label}
                  </Button>
                ))}
              </ButtonGroup>
              <InfoTooltip text={t('mailTemplates.edit.bodyModeHelp')} />
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
              spacing={2}
            >
              <Stack
                direction="row"
                sx={{ alignItems: 'center' }}
                spacing={0.75}
              >
                <FieldLabel
                  id={ids.background}
                  label={t('mailTemplates.edit.background', 'Background')}
                  help={t('mailTemplates.edit.backgroundHelp')}
                />
                <MailColorPicker
                  value={backgroundColor}
                  label={t('mailTemplates.edit.background', 'Background')}
                  size={28}
                  onChange={color => applyShell({ backgroundColor: color })}
                />
              </Stack>
              <Stack
                direction="row"
                sx={{ alignItems: 'center' }}
                spacing={0.75}
              >
                <FieldLabel
                  id={ids.width}
                  label={t('mailTemplates.edit.contentWidth', 'Width (px)')}
                  help={t('mailTemplates.edit.contentWidthHelp')}
                />
                <TextField
                  type="number"
                  value={contentWidth}
                  onChange={event => {
                    const parsed = parseInt(event.target.value, 10);
                    if (Number.isFinite(parsed)) {
                      applyShell({ contentWidth: parsed });
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      min: 320,
                      max: 1200,
                      step: 20,
                      'aria-labelledby': ids.width,
                    },
                  }}
                  style={{ width: 96 }}
                />
              </Stack>
            </Stack>
          </Stack>

          <div
            onFocus={() => setActiveField('body')}
            style={{ height: 'calc(100vh - 320px)', minHeight: 480 }}
          >
            {/* eslint-disable react-hooks/refs */}
            {bodyMode === 'visual' ?
              <HtmlVisualEditor
                key={`visual-${editorKey}`}
                ref={visualRef}
                value={htmlRef.current}
                onChange={handleHtmlChange}
                onActivate={() => setActiveField('body')}
              />
            : bodyMode === 'html' ?
              <HtmlSourceEditor
                key={`html-${editorKey}`}
                ref={sourceRef}
                value={htmlRef.current}
                onChange={handleHtmlChange}
              />
            : /* eslint-enable react-hooks/refs */
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  variant="caption"
                  style={{ marginBottom: 6, color: 'text.secondary' }}
                  sx={{
                    display: 'block',
                  }}
                >
                  {t(
                    'mailTemplates.edit.textContentReadonlyHint',
                    'Automatically generated from the content. Edit the visual or HTML tab to change it.'
                  )}
                </Typography>
                <TextField
                  value={textContent}
                  slotProps={{ input: { readOnly: true } }}
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    resize: 'none',
                  }}
                  multiline
                />
              </div>
            }
          </div>
        </div>
      </Box>
      <Dialog
        fullWidth
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
      >
        <DialogTitle>
          {t('mailTemplates.subject')}: {previewSubject || '—'}
        </DialogTitle>
        <DialogContent style={{ height: '85vh' }}>
          <MailPreview html={previewHtml ?? ''} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetMailTemplates.id,
  CanCreateMailTemplates.id,
  CanUpdateMailTemplates.id,
])(MailTemplateEdit);
export { CheckedPermissionComponent as MailTemplateEdit };
