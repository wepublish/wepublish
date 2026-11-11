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
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  createCheckedPermissionComponent,
  enqueueSnackbar,
  PageTitle,
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
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import { mailTypeLabel } from './mail-placeholders';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';

const StatusTag = styled(Chip)`
  white-space: nowrap;

  .rs-tag-text {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  svg {
    flex-shrink: 0;
    color: var(
      --wep-state-draft-text,
      ${({ theme }) => theme.vars.palette.warning.main}
    );
  }
`;

function MailTemplateList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: queryData } = useQuery(MailTemplateDocument);

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
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('mailTemplates.availableTemplates')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={[CanUpdateMailTemplates.id]}
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
            qualifyingPermissions={[CanCreateMailTemplates.id]}
          >
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => navigate('/mailtemplates/create')}
            >
              {t('mailTemplates.create')}
            </Button>
          </PermissionControl>
        </ListViewActions>
      </ListViewContainer>

      <TableContainer style={{ marginTop: '16px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('mailTemplates.name')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailTemplates.edit.mailType')}</strong>{' '}
                <InfoTooltip
                  text={t('mailTemplates.edit.purposeHint')}
                  label={t('moreInfo')}
                />
              </TableCell>
              <TableCell>
                <strong>{t('mailTemplates.description')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailTemplates.subject')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailTemplates.status')}</strong>{' '}
                <InfoTooltip
                  text={t('mailTemplates.statusHelp')}
                  label={t('moreInfo')}
                />
              </TableCell>
              <TableCell align="center">
                <strong>{t('action')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {queryData && !queryData.mailTemplates.length && (
              <TableRow>
                <TableCell colSpan={6}>{t('mailTemplates.empty')}</TableCell>
              </TableRow>
            )}

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
                    <MdCheck
                      role="img"
                      aria-label={t('ok')}
                    />
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
                      qualifyingPermissions={[CanUpdateMailTemplates.id]}
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
                      qualifyingPermissions={[CanDeleteMailTemplates.id]}
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
            variant="text"
            onClick={() => setDeleteId(null)}
          >
            {t('mailTemplates.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
          >
            {t('mailTemplates.delete')}
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
            variant="text"
            onClick={() => setImportOpen(false)}
          >
            {t('mailTemplates.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            loading={importing}
            onClick={confirmImport}
          >
            {t('mailTemplates.importConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetMailTemplates.id,
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
