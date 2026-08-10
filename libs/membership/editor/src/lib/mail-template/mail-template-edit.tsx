import { Typography } from '@mui/material';
import { useApolloClient } from '@apollo/client';
import {
  MailTemplateContext,
  MailTemplatePreviewDocument,
  MailTemplatePreviewInput,
  MailTemplatePreviewQuery,
  MailTemplatePreviewQueryVariables,
  useCreateMailTemplateMutation,
  useMailTemplateLazyQuery,
  useMailTemplateSubscriptionsLazyQuery,
  useSendTestMailTemplateMutation,
  useUpdateMailTemplateMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ButtonGroup,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Panel,
  SelectPicker,
  Stack,
  toaster,
} from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
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

  const [loadTemplate] = useMailTemplateLazyQuery({
    fetchPolicy: 'network-only',
  });
  const [createMailTemplate] = useCreateMailTemplateMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [updateMailTemplate] = useUpdateMailTemplateMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const client = useApolloClient();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendTest, { loading: testLoading }] = useSendTestMailTemplateMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [searchSubscriptions, { data: subscriptionData }] =
    useMailTemplateSubscriptionsLazyQuery();

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    loadTemplate().then(({ data }) => {
      const template = data?.mailTemplates.find(mt => mt.id === id);
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
    if (!name) {
      toaster.push(
        <Message type="error">{t('mailTemplates.edit.nameRequired')}</Message>
      );
      return;
    }
    // The mail type is enforced on save (existing null-type templates still
    // load, but can't be saved again without choosing one).
    if (!contextId) {
      toaster.push(
        <Message type="error">
          {t(
            'mailTemplates.edit.selectMailType',
            'Please choose a purpose first.'
          )}
        </Message>
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
      setPreviewSubject(data.mailTemplatePreview.subject);
      setPreviewHtml(data.mailTemplatePreview.html);
      setPreviewOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPreviewError(message);
      setPreviewHtml(null);
      toaster.push(<Message type="error">{message}</Message>);
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
    toaster.push(
      <Message type="success">{t('mailTemplates.edit.testSent')}</Message>
    );
  };

  const contextOptions = MAIL_PLACEHOLDER_CONTEXTS.map(c => ({
    label: t(c.titleKey, c.title),
    description: t(`mailTemplates.purposeDescriptions.${c.id}`),
    value: c.id,
  }));

  return (
    <div style={{ flexShrink: 0 }}>
      <Stack
        justifyContent="space-between"
        alignItems="center"
      >
        <ListViewContainer>
          <ListViewHeader>
            <h2>
              {isEdit ?
                t('mailTemplates.edit.editHeader')
              : t('mailTemplates.edit.createHeader')}
            </h2>
          </ListViewHeader>
        </ListViewContainer>
        <ButtonGroup>
          <Button
            appearance="ghost"
            onClick={() => navigate('/mailtemplates')}
          >
            {t('mailTemplates.cancel')}
          </Button>
          <Button
            appearance="default"
            onClick={() => save(false)}
          >
            {t('mailTemplates.save')}
          </Button>
          <Button
            appearance="primary"
            onClick={() => save(true)}
          >
            {t('mailTemplates.edit.saveAndClose')}
          </Button>
        </ButtonGroup>
      </Stack>

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
          background: '#fff',
        }}
      >
        <Panel
          bordered
          header={t('mailTemplates.edit.details', 'Details')}
          style={{ flex: 1, minWidth: 360, background: '#fff' }}
        >
          <Form fluid>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Form.Group style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <Form.ControlLabel>
                  {t('mailTemplates.edit.mailType')} *
                </Form.ControlLabel>
                <SelectPicker
                  block
                  cleanable={false}
                  searchable={false}
                  data={contextOptions}
                  value={contextId}
                  onChange={value =>
                    setContextId((value as MailTemplateContext) ?? null)
                  }
                  // rsuite's popup defaults to z-index 7; lift it above the
                  // sticky header row (z-index 10) so the menu isn't covered
                  // when it opens down over the content below.
                  popupStyle={{ zIndex: 100, maxWidth: 520 }}
                  placeholder={t(
                    'mailTemplates.edit.selectMailTypePlaceholder',
                    'Choose a purpose …'
                  )}
                  // The purposes differ in which data they carry, which the
                  // bare title doesn't convey — describe each one in the menu.
                  renderOption={(label, item) => (
                    <div style={{ paddingBlock: 2 }}>
                      <div>{label}</div>
                      <Typography
                        variant="caption"
                        display="block"
                        style={{
                          color: '#8e8e93',
                          whiteSpace: 'normal',
                          lineHeight: 1.35,
                        }}
                      >
                        {(item as { description?: string }).description}
                      </Typography>
                    </div>
                  )}
                />
                <Typography
                  variant="caption"
                  display="block"
                  style={{ marginTop: 4, color: '#8e8e93' }}
                >
                  {t('mailTemplates.edit.purposeHint')}
                </Typography>
              </Form.Group>
              <Form.Group style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <Form.ControlLabel>{t('mailTemplates.name')}</Form.ControlLabel>
                <Input
                  value={name}
                  onChange={setName}
                />
              </Form.Group>
              <Form.Group style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <Form.ControlLabel>
                  {t('mailTemplates.description')}
                </Form.ControlLabel>
                <Input
                  value={description}
                  onChange={setDescription}
                />
              </Form.Group>
              <Form.Group style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <Form.ControlLabel>
                  {t('mailTemplates.subject')}
                </Form.ControlLabel>
                <Input
                  value={subject}
                  onChange={setSubject}
                  onFocus={() => setActiveField('subject')}
                />
              </Form.Group>
            </div>
          </Form>
        </Panel>

        <Panel
          bordered
          header={t('mailTemplates.edit.previewAndTest')}
          style={{ flex: 1, minWidth: 360, background: '#fff' }}
        >
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <Form.ControlLabel>
                {t('mailTemplates.edit.sampleSubscription')}
              </Form.ControlLabel>
              <SelectPicker
                block
                data={(subscriptionData?.mailTemplateSubscriptions ?? []).map(
                  s => ({ label: s.label, value: s.id })
                )}
                value={subscriptionId}
                onChange={value => setSubscriptionId(value)}
                onSearch={query =>
                  searchSubscriptions({ variables: { query } })
                }
                onOpen={() => searchSubscriptions({ variables: {} })}
                // Same as the mail-type picker: lift the popup above the
                // sticky header row (z-index 10) so it isn't clipped/covered.
                popupStyle={{ zIndex: 100 }}
                placeholder={t('mailTemplates.edit.sampleDataFallback')}
              />
            </div>
            <Stack spacing={8}>
              <Button
                appearance="primary"
                loading={previewLoading}
                onClick={doPreview}
              >
                {t('mailTemplates.edit.preview')}
              </Button>
              <Button
                appearance="default"
                loading={testLoading}
                onClick={doSendTest}
              >
                {t('mailTemplates.edit.sendTest')}
              </Button>
            </Stack>
          </div>

          <Typography
            variant="caption"
            display="block"
            style={{ marginTop: 8, color: '#8e8e93' }}
          >
            {t(
              'mailTemplates.edit.testRecipientHint',
              'Test mails are always sent to your own account.'
            )}
          </Typography>

          {previewError && (
            <Message
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            >
              {previewError}
            </Message>
          )}
        </Panel>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 16,
          alignItems: 'stretch',
        }}
      >
        {/* Bounded to the editor column's height: the picker is absolutely
            positioned so it never grows the row, and scrolls internally. */}
        <div style={{ width: 320, flexShrink: 0, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
            }}
          >
            <PlaceholderPicker
              onInsert={insertToken}
              context={contextId}
            />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Stack
            spacing={8}
            justifyContent="space-between"
            alignItems="center"
            style={{ marginBottom: 8 }}
          >
            <ButtonGroup size="sm">
              <Button
                appearance={bodyMode === 'visual' ? 'primary' : 'default'}
                onClick={() => switchMode('visual')}
              >
                {t('mailTemplates.wysiwyg')}
              </Button>
              <Button
                appearance={bodyMode === 'html' ? 'primary' : 'default'}
                onClick={() => switchMode('html')}
              >
                {t('mailTemplates.rawHtml')}
              </Button>
              <Button
                appearance={bodyMode === 'text' ? 'primary' : 'default'}
                onClick={() => switchMode('text')}
              >
                {t('mailTemplates.textContent')}
              </Button>
            </ButtonGroup>

            <Stack
              spacing={16}
              alignItems="center"
            >
              <Stack
                spacing={6}
                alignItems="center"
              >
                <Form.ControlLabel style={{ margin: 0 }}>
                  {t('mailTemplates.edit.background', 'Background')}
                </Form.ControlLabel>
                <MailColorPicker
                  value={backgroundColor}
                  size={28}
                  onChange={color => applyShell({ backgroundColor: color })}
                />
              </Stack>
              <Stack
                spacing={6}
                alignItems="center"
              >
                <Form.ControlLabel style={{ margin: 0 }}>
                  {t('mailTemplates.edit.contentWidth', 'Width (px)')}
                </Form.ControlLabel>
                <InputNumber
                  size="sm"
                  min={320}
                  max={1200}
                  step={20}
                  value={contentWidth}
                  onChange={value => {
                    const parsed =
                      typeof value === 'number' ? value : (
                        parseInt(`${value}`, 10)
                      );
                    if (Number.isFinite(parsed)) {
                      applyShell({ contentWidth: parsed });
                    }
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
            : <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  variant="caption"
                  display="block"
                  style={{ marginBottom: 6, color: '#8e8e93' }}
                >
                  {t(
                    'mailTemplates.edit.textContentReadonlyHint',
                    'Automatically generated from the content. Edit the visual or HTML tab to change it.'
                  )}
                </Typography>
                <Input
                  as="textarea"
                  readOnly
                  value={textContent}
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    resize: 'none',
                  }}
                />
              </div>
            }
          </div>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        size="full"
      >
        <Modal.Header>
          <Modal.Title>
            {t('mailTemplates.subject')}: {previewSubject || '—'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '85vh' }}>
          <MailPreview html={previewHtml ?? ''} />
        </Modal.Body>
      </Modal>
    </div>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_CREATE_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
])(MailTemplateEdit);
export { CheckedPermissionComponent as MailTemplateEdit };
