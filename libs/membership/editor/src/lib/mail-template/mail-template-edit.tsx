import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
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
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useApolloClient } from '@apollo/client/react';
import {
  CreateMailTemplateDocument,
  DeleteMailTemplateVariantDocument,
  MailChannel,
  MailTemplateByIdDocument,
  MailTemplateContext,
  MailTemplateLetterPreviewDocument,
  MailTemplateLetterPreviewQuery,
  MailTemplateLetterPreviewQueryVariables,
  MailTemplatePreviewDocument,
  MailTemplatePreviewInput,
  MailTemplatePreviewQuery,
  MailTemplatePreviewQueryVariables,
  LetterLayoutsDocument,
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
import { LetterAppendixPicker } from './letter-appendix-picker';
import { LetterPreview } from './letter-preview';
import { useLetterChannel } from './use-letter-channel';
import { MailPreview } from './mail-preview';
import { MAIL_PLACEHOLDER_CONTEXTS } from './mail-placeholders';
import { PlaceholderPicker } from './placeholder-picker';
import { testMailInput } from './test-mail-input';
import {
  allowsLetterVersion,
  draftsFromVariants,
  newVersionDraft,
  removedChannels,
  variantInputs,
  VERSION_ORDER,
  VersionDraft,
  VersionDrafts,
} from './template-versions';
import { deliveryChannel } from '../delivery-mode/channels';
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
  // What the template says on each channel. The body of the version being
  // edited lives in `htmlRef` until the author leaves it or saves.
  const [drafts, setDrafts] = useState<VersionDrafts>(() => ({
    [MailChannel.Mail]: newVersionDraft(),
  }));
  const [activeChannel, setActiveChannel] = useState(MailChannel.Mail);
  // The versions the api has, so the ones taken away here can be deleted.
  const [savedChannels, setSavedChannels] = useState<MailChannel[]>([]);
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
    letterLayout: `${fieldId}-letter-layout`,
    letterAppendix: `${fieldId}-letter-appendix`,
    versionPanel: `${fieldId}-version`,
    removeTitle: `${fieldId}-remove-title`,
    removeText: `${fieldId}-remove-text`,
    versionTab: (channel: MailChannel) => `${fieldId}-version-${channel}`,
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
  const [deleteVariant] = useMutation(
    DeleteMailTemplateVariantDocument,
    // Removing a version is part of the save, which already confirms.
    { onError: DEFAULT_MUTATION_OPTIONS(t).onError }
  );
  const client = useApolloClient();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [letterPdf, setLetterPdf] = useState<string | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  // Without a letter integration there is nothing to render a letter with.
  const { paperLetters, letterAvailable } = useLetterChannel();
  const { data: letterLayoutData } = useQuery(LetterLayoutsDocument, {
    skip: !letterAvailable,
  });
  const letterLayouts = letterLayoutData?.letterLayouts ?? [];
  const defaultLetterLayout = letterLayouts.find(layout => layout.isDefault);
  const [sendTest, { loading: testLoading }] = useMutation(
    SendTestMailTemplateDocument,
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [searchSubscriptions, { data: subscriptionData }] = useLazyQuery(
    MailTemplateSubscriptionsDocument
  );

  const handleHtmlChange = (html: string) => {
    htmlRef.current = html;
  };

  const isLetter = activeChannel === MailChannel.Letter;
  const activeDraft: VersionDraft = drafts[activeChannel] ?? newVersionDraft();
  const subject = activeDraft.subject;
  const letterLayoutId = activeDraft.letterLayoutId;
  const letterAppendixId = activeDraft.letterAppendixId;

  const updateActiveDraft = (
    change: (draft: VersionDraft) => Partial<VersionDraft>
  ) =>
    setDrafts(current => {
      const draft = current[activeChannel] ?? newVersionDraft();

      return { ...current, [activeChannel]: { ...draft, ...change(draft) } };
    });
  const setSubject = (next: string | ((previous: string) => string)) =>
    updateActiveDraft(draft => ({
      subject: typeof next === 'function' ? next(draft.subject) : next,
    }));

  /** Every version as it stands, the open one with what was typed since. */
  const currentDrafts = (): VersionDrafts => ({
    ...drafts,
    [activeChannel]: { ...activeDraft, html: htmlRef.current },
  });

  /** Put a version into the editor: its body, and the frame it is set in. */
  const openVersion = (channel: MailChannel, from: VersionDrafts) => {
    htmlRef.current = from[channel]?.html ?? createEmptyEmailHtml();
    const shell = readShellSettings(htmlRef.current);
    setBackgroundColor(shell.backgroundColor);
    setContentWidth(shell.contentWidth);
    setActiveChannel(channel);
    setActiveField('body');
    // A letter has no plain-text alternative to look at.
    setBodyMode(mode =>
      channel === MailChannel.Letter && mode === 'text' ? 'visual' : mode
    );
    setEditorKey(k => k + 1);
  };

  const switchVersion = (channel: MailChannel) => {
    if (channel === activeChannel) {
      return;
    }

    const next = currentDrafts();
    setDrafts(next);
    openVersion(channel, next);
  };

  const addVersion = (channel: MailChannel) => {
    const current = currentDrafts();
    const next = {
      ...current,
      [channel]: newVersionDraft(current[activeChannel]),
    };

    setDrafts(next);
    openVersion(channel, next);
  };

  // Removing a version throws away what was written for it, so it is asked
  // for first.
  const [confirmRemoval, setConfirmRemoval] = useState(false);

  // Only taken out of the form: the api hears of it on save.
  const removeActiveVersion = () => {
    setConfirmRemoval(false);

    const rest: VersionDrafts = { ...currentDrafts() };
    delete rest[activeChannel];
    const remaining = VERSION_ORDER.find(channel => rest[channel]);

    if (!remaining) {
      return;
    }

    setDrafts(rest);
    openVersion(remaining, rest);
  };

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
      setContextId(template.context ?? null);

      const loaded = draftsFromVariants(template.variants);
      const first =
        VERSION_ORDER.find(channel => loaded[channel]) ?? MailChannel.Mail;
      const next = { [first]: newVersionDraft(), ...loaded };

      setSavedChannels(template.variants.map(variant => variant.channel));
      setDrafts(next);
      openVersion(first, next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // A medium without the letter feature never sees a letter version, and the
  // api would refuse one: it stays untouched on save.
  const shownChannels = VERSION_ORDER.filter(
    channel =>
      drafts[channel] && (channel !== MailChannel.Letter || paperLetters)
  );
  const addableChannels = VERSION_ORDER.filter(
    channel =>
      !drafts[channel] && (channel !== MailChannel.Letter || letterAvailable)
  );
  const letterAllowed = allowsLetterVersion(contextId);

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

  const buildInput = (all: VersionDrafts) => ({
    name,
    description,
    context: contextId,
    variants: variantInputs(
      Object.fromEntries(
        shownChannels.flatMap(channel =>
          all[channel] ? [[channel, all[channel]]] : []
        )
      ),
      deriveTextFromHtml
    ),
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
    const all = currentDrafts();
    const input = buildInput(all);

    if (isEdit) {
      const result = await updateMailTemplate({
        variables: { id: id!, input },
      });

      if (result?.error) {
        return;
      }

      // After the update, so a version added in the same save is already
      // there when the last saved one goes.
      for (const channel of removedChannels(savedChannels, all)) {
        const removed = await deleteVariant({
          variables: { templateId: id!, channel },
        });

        if (removed?.error) {
          return;
        }
      }

      setSavedChannels(current => [
        ...current.filter(channel => all[channel]),
        ...input.variants
          .map(variant => variant.channel)
          .filter(channel => !current.includes(channel)),
      ]);
    } else {
      const result = await createMailTemplate({
        variables: { input },
      });
      const newId = result?.data?.createMailTemplate.id;
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
    ...(isLetter ? { letterLayoutId, letterAppendixId } : {}),
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

  // Rendered by the same pdf renderer a letter send uses, so the sheet shows
  // exactly what would be printed.
  const doPreviewLetter = async () => {
    const ctx = effectiveContext();
    setLetterLoading(true);
    setPreviewError(null);
    try {
      const { data, error } = await client.query<
        MailTemplateLetterPreviewQuery,
        MailTemplateLetterPreviewQueryVariables
      >({
        query: MailTemplateLetterPreviewDocument,
        variables: { input: previewInput(ctx) },
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      });
      if (error) {
        throw error;
      }
      setLetterPdf(data!.mailTemplateLetterPreview.pdf);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPreviewError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLetterLoading(false);
    }
  };

  const doSendTest = async () => {
    const ctx = effectiveContext();
    await sendTest({
      variables: {
        input: testMailInput(previewInput(ctx)),
      },
    });
    enqueueSnackbar(t('mailTemplates.edit.testSent'), { variant: 'success' });
  };

  // A letter has no plain-text alternative.
  const bodyModes = (
    [
      ['visual', t('mailTemplates.wysiwyg')],
      ['html', t('mailTemplates.rawHtml')],
      ['text', t('mailTemplates.textContent')],
    ] as const
  ).filter(([mode]) => mode !== 'text' || !isLetter);

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
      {/* Not sticky: with the versions the tiles are tall enough to cover
          most of the window, and the editor would scroll away behind them. */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'stretch',
          marginTop: 16,
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
                {/* Purpose and name share the first row; the description
                    takes the second. */}
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
                        // The name alone: the hints belong to the list.
                        renderValue: value =>
                          contextOptions.find(option => option.value === value)
                            ?.label ??
                          t(
                            'mailTemplates.edit.selectMailTypePlaceholder',
                            'Choose a purpose …'
                          ),
                      },
                    }}
                    fullWidth
                  >
                    {/* A dashed line sets "no purpose yet" apart from the
                        purposes. On the item itself: the select turns every
                        child into an option, a divider included. */}
                    <MenuItem
                      value=""
                      sx={{
                        borderBottom: '1px dashed',
                        borderColor: 'divider',
                        marginBottom: 1,
                        paddingBottom: 1,
                      }}
                    >
                      {t(
                        'mailTemplates.edit.selectMailTypePlaceholder',
                        'Choose a purpose …'
                      )}
                    </MenuItem>

                    {contextOptions.map(option => (
                      <MenuItem
                        key={option.value}
                        value={option.value}
                        sx={{ gap: 0.75 }}
                      >
                        {option.label}
                        {/* Reading the hint must not choose the purpose. */}
                        <span
                          style={{ display: 'inline-flex' }}
                          onClick={event => event.stopPropagation()}
                          onMouseDown={event => event.stopPropagation()}
                        >
                          <InfoTooltip
                            text={option.description}
                            placement="right"
                          />
                        </span>
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
                  style={{ flex: '1 1 100%', minWidth: 200, marginBottom: 0 }}
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
              </div>

              {(paperLetters || shownChannels.length > 1) && (
                <Stack
                  direction="row"
                  useFlexGap
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Tabs
                    value={activeChannel}
                    onChange={(_event, channel: MailChannel) =>
                      switchVersion(channel)
                    }
                    aria-label={t('mailTemplates.edit.versions')}
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {shownChannels.map(channel => {
                      const { icon: Icon, labelKey } = deliveryChannel(channel);

                      return (
                        <Tab
                          key={channel}
                          value={channel}
                          id={ids.versionTab(channel)}
                          aria-controls={ids.versionPanel}
                          icon={<Icon aria-hidden />}
                          iconPosition="start"
                          label={t(labelKey)}
                        />
                      );
                    })}
                  </Tabs>

                  {addableChannels.map(channel => {
                    const refused =
                      channel === MailChannel.Letter && !letterAllowed;

                    return (
                      <Stack
                        key={channel}
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: 'center' }}
                      >
                        <Button
                          size="small"
                          variant="text"
                          disabled={refused}
                          onClick={() => addVersion(channel)}
                        >
                          {t(`mailTemplates.edit.addVersion.${channel}`)}
                        </Button>
                        {refused && (
                          <InfoTooltip
                            text={t('mailTemplates.edit.letterNotForPurpose')}
                          />
                        )}
                      </Stack>
                    );
                  })}

                  {shownChannels.length > 1 && (
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={() => setConfirmRemoval(true)}
                    >
                      {t('mailTemplates.edit.removeVersion')}
                    </Button>
                  )}
                </Stack>
              )}

              {isLetter && !letterAllowed && (
                <Alert severity="warning">
                  {t('mailTemplates.edit.letterNotForPurpose')}
                </Alert>
              )}

              <div
                id={ids.versionPanel}
                role={
                  shownChannels.length > 1 || paperLetters ?
                    'tabpanel'
                  : undefined
                }
                aria-labelledby={
                  shownChannels.length > 1 || paperLetters ?
                    ids.versionTab(activeChannel)
                  : undefined
                }
                style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
              >
                {/* On a letter the subject takes a row of its own, with the
                    stationery and the appendix side by side below it. */}
                <FormControl
                  style={{
                    flex: isLetter ? '1 1 100%' : 1,
                    minWidth: 200,
                    marginBottom: 0,
                  }}
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
                {isLetter && letterAvailable && (
                  <FormControl
                    style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                    fullWidth
                  >
                    <FieldLabel
                      id={ids.letterLayout}
                      label={t('mailTemplates.edit.letterLayout')}
                      help={t('mailTemplates.edit.letterLayoutHelp')}
                    />
                    <TextField
                      select
                      value={letterLayoutId ?? ''}
                      onChange={event =>
                        updateActiveDraft(() => ({
                          letterLayoutId: event.target.value || null,
                        }))
                      }
                      slotProps={{
                        select: {
                          displayEmpty: true,
                          labelId: ids.letterLayout,
                        },
                      }}
                    >
                      <MenuItem value="">
                        {defaultLetterLayout ?
                          t('mailTemplates.edit.letterLayoutDefault', {
                            name: defaultLetterLayout.name,
                          })
                        : t('mailTemplates.edit.letterLayoutNone')}
                      </MenuItem>
                      {letterLayouts.map(layout => (
                        <MenuItem
                          key={layout.id}
                          value={layout.id}
                        >
                          {layout.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormControl>
                )}
                {isLetter && letterAvailable && (
                  <FormControl
                    style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                    fullWidth
                  >
                    <FieldLabel
                      id={ids.letterAppendix}
                      label={t('mailTemplates.edit.letterAppendix')}
                      help={t('mailTemplates.edit.letterAppendixHelp')}
                    />
                    <LetterAppendixPicker
                      value={letterAppendixId}
                      onChange={letterAppendixId =>
                        updateActiveDraft(() => ({ letterAppendixId }))
                      }
                    />
                  </FormControl>
                )}
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
                {!isLetter && (
                  <Button
                    variant="contained"
                    loading={previewLoading}
                    onClick={doPreview}
                  >
                    {t('mailTemplates.edit.preview')}
                  </Button>
                )}
                {isLetter && letterAvailable && (
                  <Button
                    variant="contained"
                    loading={letterLoading}
                    onClick={doPreviewLetter}
                  >
                    {t('mailTemplates.edit.previewLetter')}
                  </Button>
                )}
                {!isLetter && (
                  <Button
                    variant="outlined"
                    loading={testLoading}
                    onClick={doSendTest}
                  >
                    {t('mailTemplates.edit.sendTest')}
                  </Button>
                )}
              </Stack>
            </div>

            {!isLetter && (
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
            )}

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
      {/* A grid, so the placeholders start level with the editor: the
          editor's toolbar sits in a row of its own above it, and the cell
          beside the toolbar stays empty. Stacked on a narrow window. */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: '320px minmax(0, 1fr)',
          },
          columnGap: 3,
          marginTop: 2,
        }}
      >
        {/* Bounded to the editor's height: the picker is absolutely
            positioned so it never grows the row, and scrolls internally. */}
        <Box
          sx={{
            gridColumn: { md: 1 },
            gridRow: { md: 2 },
            position: 'relative',
            marginBottom: { xs: 3, md: 0 },
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

        {/* No box of its own: toolbar and editor are placed in the grid. */}
        <Box sx={{ display: 'contents' }}>
          <Stack
            direction="row"
            useFlexGap
            sx={{
              gridColumn: { md: 2 },
              gridRow: { md: 1 },
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
                {bodyModes.map(([mode, label]) => (
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
              {/* One bullet per mode on offer, each on its own line: the
                  tooltip keeps line breaks. */}
              <InfoTooltip
                text={bodyModes
                  .map(
                    ([mode, label]) =>
                      `• ${label}: ${t(`mailTemplates.edit.bodyModeHints.${mode}`)}`
                  )
                  .join('\n')}
              />
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

          <Box
            onFocus={() => setActiveField('body')}
            sx={{
              gridColumn: { md: 2 },
              gridRow: { md: 2 },
              height: 'calc(100vh - 320px)',
              minHeight: 480,
            }}
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
              <Box sx={{ position: 'relative', height: '100%' }}>
                {/* The text scrolls in a box of the editor's height, so the
                    note below stays in the corner of what is on screen. */}
                <Box
                  sx={{
                    height: '100%',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <TextField
                    value={textContent}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      // Fills the editor's box even for a short text: the
                      // note sits in the corner of that box.
                      flex: '1 0 auto',
                      '& .MuiInputBase-root': {
                        flex: 1,
                        alignItems: 'flex-start',
                        fontFamily: 'monospace',
                        // Room for the note, so it never covers the last line.
                        paddingBottom: 7,
                      },
                    }}
                    fullWidth
                    multiline
                  />
                </Box>
                {/* Says on the text itself why it cannot be typed into. Dark
                    on light grey in both colour modes, and clicks pass
                    through to the text below. */}
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    zIndex: 1,
                    right: 16,
                    bottom: 12,
                    paddingBlock: 0.5,
                    paddingInline: 1,
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    color: 'grey.900',
                    pointerEvents: 'none',
                  }}
                >
                  {t('mailTemplates.edit.textContentGenerated')}
                </Typography>
              </Box>
            }
          </Box>
        </Box>
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

      <Dialog
        open={confirmRemoval}
        onClose={() => setConfirmRemoval(false)}
        aria-labelledby={ids.removeTitle}
        aria-describedby={ids.removeText}
      >
        <DialogTitle id={ids.removeTitle}>
          {t(`mailTemplates.edit.removeVersionConfirm.title.${activeChannel}`)}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id={ids.removeText}>
            {t(`mailTemplates.edit.removeVersionConfirm.text.${activeChannel}`)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmRemoval(false)}
          >
            {t('mailTemplates.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={removeActiveVersion}
          >
            {t('mailTemplates.edit.removeVersionConfirm.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullScreen
        open={!!letterPdf}
        onClose={() => setLetterPdf(null)}
      >
        <DialogTitle>{t('mailTemplates.edit.letterPreviewTitle')}</DialogTitle>
        <DialogContent style={{ height: '85vh' }}>
          {letterPdf && <LetterPreview pdf={letterPdf} />}
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
