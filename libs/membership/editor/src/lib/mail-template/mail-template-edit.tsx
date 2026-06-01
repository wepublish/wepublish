import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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
import { MdCode, MdDelete, MdEdit, MdOpenInNew } from 'react-icons/md';
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
import { HtmlSourceEditor, HtmlSourceEditorHandle } from './html-source-editor';
import { HtmlVisualEditor, HtmlVisualEditorHandle } from './html-visual-editor';
import { PlaceholderPicker } from './placeholder-picker';
import { createEmptyEmailHtml } from './mail-html';
import { formatPlaceholder, getPlaceholderSyntax } from './placeholder-syntax';

const closePath = '/mailtemplates';

type EditorMode = 'wysiwyg' | 'html';

const Column = styled(Box)`
  height: 75vh;
  min-height: 520px;
  display: flex;
  flex-direction: column;
`;

const EditorArea = styled(Box)`
  flex: 1;
  min-height: 0;
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
  const [htmlSource, setHtmlSource] = useState(() =>
    isEdit ? '' : createEmptyEmailHtml()
  );
  const [editorKey, setEditorKey] = useState(0);
  const [ready, setReady] = useState(!isEdit);
  const [close, setClose] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [remoteMissing, setRemoteMissing] = useState(false);

  // Both editors edit the very same canonical HTML string; switching between
  // them is lossless (no parsing/serializing). The latest HTML lives in a ref
  // so typing never triggers a parent re-render.
  const htmlRef = useRef<string>(isEdit ? '' : createEmptyEmailHtml());
  const visualRef = useRef<HtmlVisualEditorHandle>(null);
  const htmlEditorRef = useRef<HtmlSourceEditorHandle>(null);

  const { data: metaData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const providerName = metaData?.provider.name;
  const providerType = metaData?.provider.type;
  const syntax = useMemo(
    () => getPlaceholderSyntax(providerType),
    [providerType]
  );

  const handleHtmlChange = useCallback((html: string) => {
    htmlRef.current = html;
  }, []);

  const handleInsertPlaceholder = useCallback(
    (key: string) => {
      const token = formatPlaceholder(key, syntax);
      if (mode === 'html') {
        htmlEditorRef.current?.insertText(token);
      } else {
        visualRef.current?.insertToken(token);
      }
    },
    [mode, syntax]
  );

  const handleModeChange = useCallback(
    (_event: unknown, next: EditorMode | null) => {
      if (!next || next === mode) {
        return;
      }
      // Hand the current HTML to the other editor and remount it.
      setHtmlSource(htmlRef.current);
      setEditorKey(key => key + 1);
      setMode(next);
    },
    [mode]
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

        const html = template.content.html || createEmptyEmailHtml();
        htmlRef.current = html;
        setHtmlSource(html);
        setEditorKey(key => key + 1);
        setReady(true);
      },
    });

  useEffect(() => {
    if (id) {
      fetchContent({ variables: { id } });
    }
  }, [id, fetchContent]);

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

          {ready && (
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
                <Column>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      mb: 1,
                      flexShrink: 0,
                    }}
                  >
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

                  <EditorArea>
                    {mode === 'wysiwyg' ?
                      <HtmlVisualEditor
                        ref={visualRef}
                        key={`visual-${editorKey}`}
                        value={htmlSource}
                        onChange={handleHtmlChange}
                      />
                    : <HtmlSourceEditor
                        ref={htmlEditorRef}
                        key={`html-${editorKey}`}
                        value={htmlSource}
                        onChange={handleHtmlChange}
                      />
                    }
                  </EditorArea>
                </Column>
              </Grid>
            </Grid>
          )}
        </SingleViewContent>
      </Form>

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
