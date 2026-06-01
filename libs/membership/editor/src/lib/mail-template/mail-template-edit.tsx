import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Descendant } from 'slate';
import { Form, Message, toaster } from 'rsuite';
import {
  Box,
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  MdCode,
  MdDelete,
  MdEdit,
  MdOpenInNew,
  MdVisibility,
} from 'react-icons/md';
import {
  createCheckedPermissionComponent,
  SingleView,
  SingleViewContent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import {
  useCreateMailTemplateMutation,
  useDeleteMailTemplateMutation,
  useMailTemplateContentLazyQuery,
  useMailTemplateQuery,
  useUpdateMailTemplateMutation,
} from '@wepublish/editor/api';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
import {
  createMailEditor,
  insertPlaceholder,
  MailTemplateEditor,
} from './mail-template-editor';
import { HtmlSourceEditor } from './html-source-editor';
import { PlaceholderPicker } from './placeholder-picker';
import { MailTemplatePreview } from './mail-template-preview';
import {
  createEmptyDocument,
  parseEmailHtml,
  serializeToEmailHtml,
} from './mail-html';
import { getPlaceholderSyntax } from './placeholder-syntax';

const closePath = '/mailtemplates';

// Delay before the (relatively expensive) preview re-renders while typing.
const PREVIEW_DEBOUNCE_MS = 300;

type EditorMode = 'wysiwyg' | 'html';

const Column = styled(Box)`
  height: 640px;
  display: flex;
  flex-direction: column;
`;

const EditorColumn = styled(Column)`
  overflow-y: auto;
`;

function MailTemplateEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [mode, setMode] = useState<EditorMode>('wysiwyg');
  const [initialValue, setInitialValue] = useState<Descendant[] | undefined>(
    isEdit ? undefined : createEmptyDocument()
  );
  const [htmlSource, setHtmlSource] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [htmlKey, setHtmlKey] = useState(0);
  const [close, setClose] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [remoteMissing, setRemoteMissing] = useState(false);

  // The editors are uncontrolled; the canonical HTML and the latest Slate
  // document live in refs so typing never triggers a parent re-render. The
  // preview is updated debounced instead.
  const htmlRef = useRef<string>('');
  const valueRef = useRef<Descendant[]>(createEmptyDocument());
  const previewTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Recreate the editor whenever we (re)load a document so initialValue applies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const editor = useMemo(() => createMailEditor(), [editorKey]);

  const { data: metaData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const providerName = metaData?.provider.name;
  const providerType = metaData?.provider.type;
  const syntax = useMemo(
    () => getPlaceholderSyntax(providerType),
    [providerType]
  );

  const schedulePreview = useCallback((html: string) => {
    if (previewTimeout.current) {
      clearTimeout(previewTimeout.current);
    }
    previewTimeout.current = setTimeout(
      () => setPreviewHtml(html),
      PREVIEW_DEBOUNCE_MS
    );
  }, []);

  const handleEditorChange = useCallback(
    (nodes: Descendant[]) => {
      valueRef.current = nodes;
      const html = serializeToEmailHtml(nodes, syntax);
      htmlRef.current = html;
      schedulePreview(html);
    },
    [syntax, schedulePreview]
  );

  const handleHtmlChange = useCallback(
    (html: string) => {
      htmlRef.current = html;
      schedulePreview(html);
    },
    [schedulePreview]
  );

  const handleInsertPlaceholder = useCallback(
    (key: string) => insertPlaceholder(editor, key),
    [editor]
  );

  const handleModeChange = useCallback(
    (_event: unknown, next: EditorMode | null) => {
      if (!next || next === mode) {
        return;
      }
      if (next === 'html') {
        // Switching to raw HTML: show the current document as HTML.
        setHtmlSource(htmlRef.current);
        setHtmlKey(key => key + 1);
        setMode('html');
      } else {
        // Switching to the visual editor: parse the (possibly hand-edited)
        // HTML back into the editor (best-effort for custom markup).
        const parsed = parseEmailHtml(htmlRef.current, syntax);
        valueRef.current = parsed;
        setInitialValue(parsed);
        setEditorKey(key => key + 1);
        setMode('wysiwyg');
      }
    },
    [mode, syntax]
  );

  const [fetchContent, { loading: contentLoading }] =
    useMailTemplateContentLazyQuery({
      ...DEFAULT_QUERY_OPTIONS(),
      fetchPolicy: 'network-only',
      onCompleted: data => {
        const template = data.mailTemplate;
        setName(template.name);
        setDescription(template.description ?? '');
        setSubject(template.content.subject ?? '');
        setExternalUrl(template.url);
        setRemoteMissing(template.remoteMissing);

        const html =
          template.content.html ||
          serializeToEmailHtml(createEmptyDocument(), syntax);
        htmlRef.current = html;
        valueRef.current = parseEmailHtml(html, syntax);
        setInitialValue(valueRef.current);
        setHtmlSource(html);
        setPreviewHtml(html);
        setEditorKey(key => key + 1);
      },
    });

  useEffect(() => {
    if (id) {
      fetchContent({ variables: { id } });
    }
  }, [id, fetchContent]);

  // Initial state for the create case.
  useEffect(() => {
    if (!isEdit) {
      const empty = createEmptyDocument();
      const html = serializeToEmailHtml(empty, syntax);
      valueRef.current = empty;
      htmlRef.current = html;
      setHtmlSource(html);
      setPreviewHtml(html);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (previewTimeout.current) {
        clearTimeout(previewTimeout.current);
      }
    },
    []
  );

  const [createMailTemplate, { loading: creating }] =
    useCreateMailTemplateMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const [updateMailTemplate, { loading: updating }] =
    useUpdateMailTemplateMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const [deleteMailTemplate, { loading: deleting }] =
    useDeleteMailTemplateMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const loading = contentLoading || creating || updating || deleting;

  const header =
    isEdit ?
      name || t('mailTemplates.edit.editHeader')
    : t('mailTemplates.edit.createHeader');

  async function save() {
    if (!name.trim()) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={3000}
        >
          {t('mailTemplates.edit.nameRequired')}
        </Message>
      );
      return;
    }

    const html = htmlRef.current;

    if (isEdit && id) {
      await updateMailTemplate({
        variables: { id, input: { name, description, subject, html } },
      });
    } else {
      const result = await createMailTemplate({
        variables: { input: { name, description, subject, html } },
      });
      const newId = result.data?.createMailTemplate.id;
      if (newId && !close) {
        navigate(`/mailtemplates/edit/${newId}`);
      }
    }

    if (close) {
      navigate(closePath);
    }
  }

  async function confirmDelete() {
    if (!id) {
      return;
    }
    await deleteMailTemplate({ variables: { id } });
    setDeleteOpen(false);
    navigate(closePath);
  }

  const additionalMenu = (
    <Stack
      direction="row"
      spacing={1}
    >
      {isEdit && externalUrl && !remoteMissing && (
        <MuiButton
          variant="outlined"
          startIcon={<MdOpenInNew />}
          onClick={() => window.open(externalUrl, '_blank', 'noreferrer')}
        >
          {t('mailTemplates.view', { provider: providerName })}
        </MuiButton>
      )}
      {isEdit && (
        <MuiButton
          variant="outlined"
          color="error"
          startIcon={<MdDelete />}
          onClick={() => setDeleteOpen(true)}
        >
          {t('mailTemplates.edit.delete')}
        </MuiButton>
      )}
    </Stack>
  );

  return (
    <SingleView>
      <Form
        onSubmit={(_value, event) => {
          event?.preventDefault();
          save();
        }}
        fluid
      >
        <SingleViewTitle
          loading={loading}
          loadingTitle={t('mailTemplates.edit.loading')}
          title={header}
          saveBtnTitle={t('mailTemplates.edit.save')}
          saveAndCloseBtnTitle={t('mailTemplates.edit.saveAndClose')}
          closePath={closePath}
          setCloseFn={setClose}
          additionalMenu={additionalMenu}
        />

        <SingleViewContent>
          <Grid
            container
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                required
                label={t('mailTemplates.name')}
                value={name}
                onChange={event => setName(event.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                label={t('mailTemplates.description')}
                value={description}
                onChange={event => setDescription(event.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                label={t('mailTemplates.edit.subject')}
                helperText={t('mailTemplates.edit.subjectHint')}
                value={subject}
                onChange={event => setSubject(event.target.value)}
              />
            </Grid>
          </Grid>

          {initialValue && (
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                md={3}
              >
                <Column>
                  <PlaceholderPicker onInsert={handleInsertPlaceholder} />
                </Column>
              </Grid>

              <Grid
                item
                xs={12}
                md={9}
              >
                <EditorColumn>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <MuiButton
                      variant="outlined"
                      size="small"
                      startIcon={<MdVisibility />}
                      onClick={() => setPreviewOpen(true)}
                    >
                      {t('mailTemplates.editor.preview')}
                    </MuiButton>

                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={mode}
                      onChange={handleModeChange}
                    >
                      <ToggleButton value="wysiwyg">
                        <MdEdit />
                        &nbsp;{t('mailTemplates.editor.visual')}
                      </ToggleButton>
                      <ToggleButton value="html">
                        <MdCode />
                        &nbsp;HTML
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {mode === 'wysiwyg' ?
                    <MailTemplateEditor
                      key={editorKey}
                      editor={editor}
                      value={initialValue}
                      onChange={handleEditorChange}
                    />
                  : <HtmlSourceEditor
                      key={htmlKey}
                      value={htmlSource}
                      onChange={handleHtmlChange}
                    />
                  }
                </EditorColumn>
              </Grid>
            </Grid>
          )}
        </SingleViewContent>
      </Form>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: { width: '95vw', height: '92vh', maxWidth: 'none', m: 0 },
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <MailTemplatePreview
              html={previewHtml}
              providerType={providerType}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setPreviewOpen(false)}>
            {t('mailTemplates.edit.close')}
          </MuiButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      >
        <DialogTitle>{t('mailTemplates.edit.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('mailTemplates.edit.deleteConfirm', { name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDeleteOpen(false)}>
            {t('mailTemplates.edit.cancel')}
          </MuiButton>
          <MuiButton
            color="error"
            variant="contained"
            onClick={confirmDelete}
          >
            {t('mailTemplates.edit.delete')}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </SingleView>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_CREATE_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
  'CAN_DELETE_MAIL-TEMPLATES',
])(MailTemplateEdit);
export { CheckedPermissionComponent as MailTemplateEdit };
