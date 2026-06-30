import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  FullMailTemplateFragment,
  MailTemplateInput,
  useCreateMailTemplateMutation,
  useDeleteMailTemplateMutation,
  useMailTemplateQuery,
  useUpdateMailTemplateMutation,
} from '@wepublish/editor/api';
import {
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  createCheckedPermissionComponent,
} from '@wepublish/ui/editor';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdCheck, MdDelete, MdEdit } from 'react-icons/md';
import {
  Button,
  ButtonGroup,
  Form,
  IconButton,
  Input,
  Modal,
  SelectPicker,
  Stack,
  Tag,
  Tooltip,
  Whisper,
} from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
import { EmailHtmlEditor, EmailHtmlEditorRef } from './email-html-editor';
import {
  ALWAYS_PLACEHOLDERS,
  MAIL_PLACEHOLDER_CONTEXTS,
  MailPlaceholder,
} from './mail-placeholders';

const emptyTemplate: MailTemplateInput = {
  name: '',
  description: '',
  subject: '',
  htmlContent: '',
  textContent: '',
};

function MailTemplateList() {
  const { t } = useTranslation();

  const { data: queryData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());

  const [createMailTemplate] = useCreateMailTemplateMutation({
    ...DEFAULT_MUTATION_OPTIONS(t),
    refetchQueries: ['MailTemplate'],
  });
  const [updateMailTemplate] = useUpdateMailTemplateMutation({
    ...DEFAULT_MUTATION_OPTIONS(t),
    refetchQueries: ['MailTemplate'],
  });
  const [deleteMailTemplate] = useDeleteMailTemplateMutation({
    ...DEFAULT_MUTATION_OPTIONS(t),
    refetchQueries: ['MailTemplate'],
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formValue, setFormValue] = useState<MailTemplateInput>(emptyTemplate);
  const [bodyMode, setBodyMode] = useState<'wysiwyg' | 'html'>('wysiwyg');
  const [activeField, setActiveField] = useState<'subject' | 'body'>('body');
  const [placeholderContext, setPlaceholderContext] =
    useState<string>('account');
  const editorRef = useRef<EmailHtmlEditorRef>(null);

  const openCreate = () => {
    setEditId(null);
    setFormValue(emptyTemplate);
    setBodyMode('wysiwyg');
    setActiveField('body');
    setPlaceholderContext('account');
    setIsOpen(true);
  };

  const openEdit = (template: FullMailTemplateFragment) => {
    setEditId(template.id);
    setFormValue({
      name: template.name,
      description: template.description ?? '',
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent ?? '',
    });
    setBodyMode('wysiwyg');
    setActiveField('body');
    setPlaceholderContext('account');
    setIsOpen(true);
  };

  const setField = (field: keyof MailTemplateInput) => (value: string) =>
    setFormValue(prev => ({ ...prev, [field]: value }));

  const switchBodyMode = (mode: 'wysiwyg' | 'html') => {
    if (mode === bodyMode) {
      return;
    }

    // Switching back to the visual editor re-parses the HTML through Tiptap,
    // which drops anything it cannot represent. Warn before losing markup.
    if (
      mode === 'wysiwyg' &&
      !window.confirm(t('mailTemplates.switchToWysiwygWarning'))
    ) {
      return;
    }

    setBodyMode(mode);
  };

  const insertPlaceholder = (key: string) => {
    const token = `{{${key}}}`;

    if (activeField === 'subject') {
      setField('subject')(formValue.subject + token);
      return;
    }

    if (bodyMode === 'wysiwyg') {
      editorRef.current?.insertText(token);
    } else {
      setField('htmlContent')(formValue.htmlContent + token);
    }
  };

  const selectedContext = MAIL_PLACEHOLDER_CONTEXTS.find(
    context => context.id === placeholderContext
  );

  // The renderer also exposes ISO (`{{key}}`), `_isoDate` and `_dateTime` for
  // manual use; they're omitted from the picker as not useful for mails.
  const dateFormats = [
    {
      suffix: '_date',
      label: t('mailTemplates.dateFormat.date', 'Date'),
      example: '30.06.2026',
    },
    {
      suffix: '_dateLong',
      label: t('mailTemplates.dateFormat.long', 'Long'),
      example: '30. Juni 2026',
    },
    {
      suffix: '_weekday',
      label: t('mailTemplates.dateFormat.weekday', 'Weekday'),
      example: 'Dienstag',
    },
    {
      suffix: '_time',
      label: t('mailTemplates.dateFormat.time', 'Time'),
      example: '10:22',
    },
  ];

  const amountFormats = [
    {
      suffix: '_display',
      label: t('mailTemplates.amountFormat.display', 'With currency'),
      example: 'CHF 10.00',
    },
    {
      suffix: '_chf',
      label: t('mailTemplates.amountFormat.chf', 'CHF'),
      example: '10.00',
    },
    {
      suffix: '',
      label: t('mailTemplates.amountFormat.rappen', 'Rappen'),
      example: '1000',
    },
  ];

  const placeholderTooltip = (
    description: string,
    token: string,
    example: string
  ) => (
    <Tooltip>
      {description}
      <br />
      <code>{token}</code>
      <br />
      {t('mailTemplates.placeholderExample', 'Example')}: {example}
    </Tooltip>
  );

  const renderPlaceholder = (placeholder: MailPlaceholder) => {
    const name = t(
      `mailTemplates.placeholderNames.${placeholder.key}`,
      placeholder.label
    );

    // Fields with multiple output formats (dates, money) render a labelled row
    // of format buttons; each inserts the matching `{{key<suffix>}}`.
    const formats =
      placeholder.kind === 'date' ? dateFormats
      : placeholder.kind === 'money' ? amountFormats
      : null;

    if (formats) {
      return (
        <div
          key={placeholder.key}
          style={{ marginBottom: 8 }}
        >
          <Typography
            variant="caption"
            display="block"
            style={{ fontWeight: 600 }}
          >
            {name}
          </Typography>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            {formats.map(format => (
              <Whisper
                key={format.suffix}
                trigger="hover"
                placement="left"
                speaker={placeholderTooltip(
                  placeholder.description,
                  `{{${placeholder.key}${format.suffix}}}`,
                  format.example
                )}
              >
                <Button
                  appearance="ghost"
                  size="xs"
                  onClick={() =>
                    insertPlaceholder(`${placeholder.key}${format.suffix}`)
                  }
                >
                  {format.label}
                </Button>
              </Whisper>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={placeholder.key}
        style={{ marginBottom: 6 }}
      >
        <Whisper
          trigger="hover"
          placement="left"
          speaker={placeholderTooltip(
            placeholder.description,
            `{{${placeholder.key}}}`,
            placeholder.example
          )}
        >
          <Button
            appearance="ghost"
            size="xs"
            block
            onClick={() => insertPlaceholder(placeholder.key)}
            style={{ textAlign: 'left' }}
          >
            {name}
          </Button>
        </Whisper>
      </div>
    );
  };

  const save = async () => {
    if (editId) {
      await updateMailTemplate({
        variables: { id: editId, input: formValue },
      });
    } else {
      await createMailTemplate({ variables: { input: formValue } });
    }

    setIsOpen(false);
  };

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('mailTemplates.availableTemplates')}</h2>
          </ListViewHeader>
        </ListViewContainer>

        <PermissionControl
          showRejectionMessage={false}
          qualifyingPermissions={['CAN_UPDATE_MAIL-TEMPLATES']}
        >
          <Button
            appearance="primary"
            onClick={openCreate}
          >
            <MdAdd />
            {t('mailTemplates.create')}
          </Button>
        </PermissionControl>
      </Stack>

      <TableContainer style={{ marginTop: '16px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('mailTemplates.name')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('mailTemplates.description')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('mailTemplates.subject')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('mailTemplates.status')}</strong>
              </TableCell>

              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {queryData &&
              queryData.mailTemplates.map(template => (
                <TableRow key={template.id.toString()}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell>
                    {template.status === 'ok' ?
                      <MdCheck />
                    : <Tag color="yellow">
                        {t(`mailTemplates.statuses.${template.status}`)}
                      </Tag>
                    }
                  </TableCell>
                  <TableCell>
                    <PermissionControl
                      showRejectionMessage={false}
                      qualifyingPermissions={['CAN_UPDATE_MAIL-TEMPLATES']}
                    >
                      <Stack spacing={8}>
                        <IconButton
                          icon={<MdEdit />}
                          onClick={() => openEdit(template)}
                        />
                        <IconButton
                          icon={<MdDelete />}
                          color="red"
                          appearance="primary"
                          onClick={() =>
                            deleteMailTemplate({
                              variables: { id: template.id },
                            })
                          }
                        />
                      </Stack>
                    </PermissionControl>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="full"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header>
          <Modal.Title>
            {editId ? t('mailTemplates.edit') : t('mailTemplates.create')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <Form
              fluid
              style={{ flex: 1, minWidth: 0 }}
            >
              <Form.Group>
                <Form.ControlLabel>{t('mailTemplates.name')}</Form.ControlLabel>
                <Input
                  value={formValue.name}
                  onChange={setField('name')}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('mailTemplates.description')}
                </Form.ControlLabel>
                <Input
                  value={formValue.description ?? ''}
                  onChange={setField('description')}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('mailTemplates.subject')}
                </Form.ControlLabel>
                <Input
                  value={formValue.subject}
                  onChange={setField('subject')}
                  onFocus={() => setActiveField('subject')}
                />
              </Form.Group>

              <Form.Group>
                <Stack
                  justifyContent="space-between"
                  alignItems="center"
                  style={{ marginBottom: 6 }}
                >
                  <Form.ControlLabel style={{ margin: 0 }}>
                    {t('mailTemplates.htmlContent')}
                  </Form.ControlLabel>

                  <ButtonGroup size="xs">
                    <Button
                      appearance={
                        bodyMode === 'wysiwyg' ? 'primary' : 'default'
                      }
                      onClick={() => switchBodyMode('wysiwyg')}
                    >
                      {t('mailTemplates.wysiwyg')}
                    </Button>
                    <Button
                      appearance={bodyMode === 'html' ? 'primary' : 'default'}
                      onClick={() => switchBodyMode('html')}
                    >
                      {t('mailTemplates.rawHtml')}
                    </Button>
                  </ButtonGroup>
                </Stack>

                {bodyMode === 'wysiwyg' ?
                  <EmailHtmlEditor
                    key={editId ?? 'new'}
                    ref={editorRef}
                    value={formValue.htmlContent}
                    onChange={setField('htmlContent')}
                    onFocus={() => setActiveField('body')}
                  />
                : <Input
                    as="textarea"
                    rows={16}
                    value={formValue.htmlContent}
                    onChange={setField('htmlContent')}
                    onFocus={() => setActiveField('body')}
                    style={{ fontFamily: 'monospace' }}
                  />
                }
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('mailTemplates.textContent')}
                </Form.ControlLabel>
                <Input
                  as="textarea"
                  rows={6}
                  value={formValue.textContent ?? ''}
                  onChange={setField('textContent')}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Group>
            </Form>

            <div style={{ width: 320, flexShrink: 0 }}>
              <strong>{t('mailTemplates.placeholders')}</strong>
              <Typography
                variant="caption"
                display="block"
                style={{ marginBottom: 12 }}
              >
                {t('mailTemplates.placeholdersHint')}
              </Typography>

              {/* User/recipient fields — always available, shown first. */}
              <Typography
                variant="subtitle2"
                style={{ marginBottom: 2 }}
              >
                {t(
                  'mailTemplates.placeholderAlways',
                  'Always available — every mail'
                )}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                style={{ marginBottom: 8, color: '#8e8e93' }}
              >
                {t(
                  'mailTemplates.placeholderAlwaysHint',
                  'These recipient fields work in every template, no matter which mail is selected below.'
                )}
              </Typography>
              {ALWAYS_PLACEHOLDERS.map(renderPlaceholder)}

              {/* Event-specific extras on top of the always-available fields. */}
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 12,
                  borderTop: '1px solid #e5e5ea',
                }}
              >
                <Form.ControlLabel>
                  {t(
                    'mailTemplates.placeholderContextLabel',
                    'Additional fields for a specific mail'
                  )}
                </Form.ControlLabel>
                <SelectPicker
                  size="sm"
                  cleanable={false}
                  searchable={false}
                  block
                  style={{ marginBottom: 12 }}
                  value={placeholderContext}
                  onChange={value => setPlaceholderContext(value ?? 'account')}
                  data={MAIL_PLACEHOLDER_CONTEXTS.map(context => ({
                    label: t(context.titleKey, context.title),
                    value: context.id,
                  }))}
                />

                {selectedContext && selectedContext.placeholders.length > 0 ?
                  <>
                    {selectedContext.note && (
                      <Typography
                        variant="caption"
                        display="block"
                        style={{ marginBottom: 8, color: '#8e8e93' }}
                      >
                        {selectedContext.note}
                      </Typography>
                    )}

                    {selectedContext.placeholders.map(renderPlaceholder)}
                  </>
                : <Typography
                    variant="caption"
                    display="block"
                    style={{ color: '#8e8e93' }}
                  >
                    {t(
                      'mailTemplates.placeholderContextNone',
                      'This mail only uses the recipient fields above.'
                    )}
                  </Typography>
                }
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            appearance="primary"
            onClick={save}
          >
            {t('mailTemplates.save')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setIsOpen(false)}
          >
            {t('mailTemplates.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
