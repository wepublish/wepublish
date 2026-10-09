import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import {
  DeleteMailTemplateDocument,
  ImportMailTemplatesFromProviderDocument,
  MailTemplateDocument,
} from '@wepublish/editor/api';
import {
  IconButtonTooltip,
  InfoTooltip,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  createCheckedPermissionComponent,
  enqueueSnackbar,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
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
import { DEFAULT_MUTATION_OPTIONS, showErrors } from '../common';
import { mailTypeLabel } from './mail-placeholders';

const StatusTag = styled(Chip)`
  white-space: nowrap;

  .rs-tag-text {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  svg {
    flex-shrink: 0;
    color: var(--wep-state-draft-text, var(--rs-state-warning));
  }
`;

function MailTemplateList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: queryData, error: queryError } = useQuery(MailTemplateDocument);

  useEffect(() => {
    if (queryError) {
      showErrors(queryError);
    }
  }, [queryError]);
  const [deleteMailTemplate] = useMutation(DeleteMailTemplateDocument, {
    ...DEFAULT_MUTATION_OPTIONS(t),
    refetchQueries: ['MailTemplate'],
  });
  const [importFromProvider, { loading: importing }] = useMutation(
    ImportMailTemplatesFromProviderDocument,
    {
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    }
  );

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
      enqueueSnackbar(t('mailTemplates.importDone', { count }), {
        variant: 'success',
      });
    } finally {
      setImportOpen(false);
    }
  };

  return (
    <>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between' }}
      >
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('mailTemplates.availableTemplates')}</h2>
          </ListViewHeader>
        </ListViewContainer>

        <Stack
          direction="row"
          spacing={1}
        >
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_UPDATE_MAIL-TEMPLATES']}
          >
            <Button
              variant="outlined"
              loading={importing}
              startIcon={<MdCloudDownload />}
              onClick={() => setImportOpen(true)}
            >
              {t('mailTemplates.importFromProvider')}
            </Button>
          </PermissionControl>

          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_CREATE_MAIL-TEMPLATES']}
          >
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => navigate('/mailtemplates/create')}
            >
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
                <strong>{t('mailTemplates.edit.mailType')}</strong>{' '}
                <InfoTooltip text={t('mailTemplates.edit.purposeHint')} />
              </TableCell>
              <TableCell>
                <strong>{t('mailTemplates.description')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailTemplates.subject')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailTemplates.status')}</strong>{' '}
                <InfoTooltip text={t('mailTemplates.statusHelp')} />
              </TableCell>
              <TableCell align="center">
                <strong>{t('action')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {queryData?.mailTemplates.map(template => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>
                  {mailTypeLabel(template.context, (k, f) => t(k, f)) ?? '—'}
                </TableCell>
                <TableCell>{template.description}</TableCell>
                <TableCell>{template.subject}</TableCell>
                <TableCell>
                  {template.status === 'ok' ?
                    <MdCheck />
                  : <StatusTag
                      icon={<MdWarning />}
                      label={t(`mailTemplates.statuses.${template.status}`)}
                    />
                  }
                </TableCell>
                <TableCell align="center">
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'center' }}
                    spacing={1}
                  >
                    <PermissionControl
                      showRejectionMessage={false}
                      qualifyingPermissions={['CAN_UPDATE_MAIL-TEMPLATES']}
                    >
                      <IconButtonTooltip caption={t('edit')}>
                        <IconButton
                          size="small"
                          aria-label={t('edit')}
                          onClick={() =>
                            navigate(`/mailtemplates/edit/${template.id}`)
                          }
                        >
                          <MdEdit />
                        </IconButton>
                      </IconButtonTooltip>
                    </PermissionControl>
                    <PermissionControl
                      showRejectionMessage={false}
                      qualifyingPermissions={['CAN_DELETE_MAIL-TEMPLATES']}
                    >
                      <IconButtonTooltip caption={t('delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={t('delete')}
                          onClick={() => setDeleteId(template.id)}
                        >
                          <MdDelete />
                        </IconButton>
                      </IconButtonTooltip>
                    </PermissionControl>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        fullWidth
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
      >
        <DialogTitle>{t('mailTemplates.delete')}</DialogTitle>
        <DialogContent>{t('mailTemplates.deleteConfirm')}</DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
          >
            {t('mailTemplates.delete')}
          </Button>
          <Button
            variant="text"
            onClick={() => setDeleteId(null)}
          >
            {t('mailTemplates.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        open={importOpen}
        onClose={() => setImportOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>{t('mailTemplates.importFromProvider')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning">{t('mailTemplates.importWarning')}</Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            loading={importing}
            onClick={confirmImport}
          >
            {t('mailTemplates.importConfirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setImportOpen(false)}
          >
            {t('mailTemplates.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
