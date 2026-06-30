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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdCheck, MdDataObject, MdDelete, MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Form, IconButton, Input, Modal, Stack, Tag } from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';

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

  const openCreate = () => {
    setEditId(null);
    setFormValue(emptyTemplate);
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
    setIsOpen(true);
  };

  const setField = (field: keyof MailTemplateInput) => (value: string) =>
    setFormValue(prev => ({ ...prev, [field]: value }));

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
                <strong>{t('mailTemplates.showPlaceholders')}</strong>
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
                    <Link to="/mailtemplates/placeholders">
                      <Button
                        appearance="default"
                        endIcon={<MdDataObject />}
                      >
                        {t('mailTemplates.goToPlaceholders')}
                      </Button>
                    </Link>
                  </TableCell>
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
        size="lg"
      >
        <Modal.Header>
          <Modal.Title>
            {editId ? t('mailTemplates.edit') : t('mailTemplates.create')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form fluid>
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
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>
                {t('mailTemplates.htmlContent')}
              </Form.ControlLabel>
              <Input
                as="textarea"
                rows={16}
                value={formValue.htmlContent}
                onChange={setField('htmlContent')}
                style={{ fontFamily: 'monospace' }}
              />
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
