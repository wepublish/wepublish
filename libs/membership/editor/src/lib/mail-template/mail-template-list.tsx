import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  useDeleteMailTemplateMutation,
  useImportMailTemplatesFromProviderMutation,
  useMailTemplateQuery,
} from '@wepublish/editor/api';
import {
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  createCheckedPermissionComponent,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdCheck,
  MdCloudDownload,
  MdDelete,
  MdEdit,
  MdWarning,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  IconButton,
  Message,
  Modal,
  Stack,
  Tag,
  toaster,
} from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';

function MailTemplateList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: queryData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const [deleteMailTemplate] = useDeleteMailTemplateMutation({
    ...DEFAULT_MUTATION_OPTIONS(t),
    refetchQueries: ['MailTemplate'],
  });
  const [importFromProvider, { loading: importing }] =
    useImportMailTemplatesFromProviderMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }
    try {
      await deleteMailTemplate({ variables: { id: deleteId } });
    } finally {
      setDeleteId(null);
    }
  };

  const confirmImport = async () => {
    try {
      const result = await importFromProvider();
      const count = result.data?.importMailTemplatesFromProvider ?? 0;
      toaster.push(
        <Message type="success">
          {t('mailTemplates.importDone', { count })}
        </Message>
      );
    } finally {
      setImportOpen(false);
    }
  };

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('mailTemplates.availableTemplates')}</h2>
          </ListViewHeader>
        </ListViewContainer>

        <Stack spacing={8}>
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_UPDATE_MAIL-TEMPLATES']}
          >
            <Button
              appearance="ghost"
              loading={importing}
              onClick={() => setImportOpen(true)}
            >
              <MdCloudDownload /> {t('mailTemplates.importFromProvider')}
            </Button>
          </PermissionControl>

          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_CREATE_MAIL-TEMPLATES']}
          >
            <Button
              appearance="primary"
              onClick={() => navigate('/mailtemplates/create')}
            >
              <MdAdd />
              {t('mailTemplates.create')}
            </Button>
          </PermissionControl>
        </Stack>
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
            {queryData?.mailTemplates.map(template => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.description}</TableCell>
                <TableCell>{template.subject}</TableCell>
                <TableCell>
                  {template.status === 'ok' ?
                    <MdCheck />
                  : <Tag color="yellow">
                      <MdWarning />{' '}
                      {t(`mailTemplates.statuses.${template.status}`)}
                    </Tag>
                  }
                </TableCell>
                <TableCell>
                  <Stack spacing={8}>
                    <PermissionControl
                      showRejectionMessage={false}
                      qualifyingPermissions={['CAN_UPDATE_MAIL-TEMPLATES']}
                    >
                      <IconButton
                        icon={<MdEdit />}
                        onClick={() =>
                          navigate(`/mailtemplates/edit/${template.id}`)
                        }
                      />
                    </PermissionControl>
                    <PermissionControl
                      showRejectionMessage={false}
                      qualifyingPermissions={['CAN_DELETE_MAIL-TEMPLATES']}
                    >
                      <IconButton
                        icon={<MdDelete />}
                        color="red"
                        appearance="primary"
                        onClick={() => setDeleteId(template.id)}
                      />
                    </PermissionControl>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        size="xs"
      >
        <Modal.Header>
          <Modal.Title>{t('mailTemplates.delete')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('mailTemplates.deleteConfirm')}</Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            color="red"
            onClick={confirmDelete}
          >
            {t('mailTemplates.delete')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setDeleteId(null)}
          >
            {t('mailTemplates.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title>{t('mailTemplates.importFromProvider')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Message
            type="warning"
            showIcon
          >
            {t('mailTemplates.importWarning')}
          </Message>
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            color="red"
            loading={importing}
            onClick={confirmImport}
          >
            {t('mailTemplates.importConfirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setImportOpen(false)}
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
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
