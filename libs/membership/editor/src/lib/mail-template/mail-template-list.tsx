import {
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  css,
  keyframes,
} from '@mui/material';
import {
  FullMailTemplateFragment,
  useDeleteMailTemplateMutation,
  useMailTemplateQuery,
  useSynchronizeMailTemplatesMutation,
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
  MdDataObject,
  MdDelete,
  MdEdit,
  MdSync,
  MdWarning,
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Stack } from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';

const spinAnimation = keyframes`
  0% {
    transform: rotate(359deg);
  }

  100% {
    transform: rotate(0deg);
  }
`;

const iconSpin = css`
  animation: ${spinAnimation} 2s infinite linear;
`;

function MailTemplateList() {
  const { t } = useTranslation();

  const { data: queryData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());

  const [templateToDelete, setTemplateToDelete] =
    useState<FullMailTemplateFragment | null>(null);

  const [syncTemplates, { loading: mutationLoading }] =
    useSynchronizeMailTemplatesMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const [deleteMailTemplate, { loading: deleting }] =
    useDeleteMailTemplateMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noreferrer');
  };

  const confirmDelete = async () => {
    if (!templateToDelete) {
      return;
    }
    await deleteMailTemplate({ variables: { id: templateToDelete.id } });
    setTemplateToDelete(null);
  };

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('mailTemplates.availableTemplates')}</h2>

            <Typography variant="subtitle1">
              {t('mailTemplates.explanation', {
                provider: queryData?.provider.name,
              })}
            </Typography>
          </ListViewHeader>
        </ListViewContainer>

        <Stack
          spacing={8}
          alignItems="center"
        >
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_CREATE_MAIL-TEMPLATES']}
          >
            <Link to="/mailtemplates/create">
              <Button appearance="primary">
                <MdAdd />
                {t('mailTemplates.create')}
              </Button>
            </Link>
          </PermissionControl>

          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_SYNC_MAIL-TEMPLATES']}
          >
            <Button
              appearance="ghost"
              onClick={() => syncTemplates()}
            >
              <MdSync css={mutationLoading ? iconSpin : undefined} />
              {t('mailTemplates.synchronize')}
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
                <strong>{t('mailTemplates.content')}</strong>
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
                  <TableCell>
                    <Link to={`/mailtemplates/edit/${template.id}`}>
                      {template.name}
                    </Link>
                  </TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    <Stack spacing={6}>
                      <Link to={`/mailtemplates/edit/${template.id}`}>
                        <Button appearance="ghost">
                          <MdEdit />
                          {t('mailTemplates.edit.edit')}
                        </Button>
                      </Link>

                      {!template.remoteMissing && (
                        <Button
                          appearance="default"
                          onClick={() => openInNewTab(template.url)}
                        >
                          {t('mailTemplates.view', {
                            provider: queryData?.provider.name,
                          })}
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
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
                    : <>
                        <MdWarning />{' '}
                        {t(`mailTemplates.statuses.${template.status}`, {
                          provider: queryData?.provider.name,
                          internalName: template.externalMailTemplateId,
                        })}
                      </>
                    }
                  </TableCell>
                  <TableCell>
                    <PermissionControl
                      showRejectionMessage={false}
                      qualifyingPermissions={['CAN_DELETE_MAIL-TEMPLATES']}
                    >
                      <IconButton
                        color="error"
                        onClick={() => setTemplateToDelete(template)}
                        aria-label={t('mailTemplates.edit.delete')}
                      >
                        <MdDelete />
                      </IconButton>
                    </PermissionControl>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
      >
        <DialogTitle>{t('mailTemplates.edit.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('mailTemplates.edit.deleteConfirm', {
              name: templateToDelete?.name,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setTemplateToDelete(null)}>
            {t('mailTemplates.edit.cancel')}
          </MuiButton>
          <MuiButton
            color="error"
            variant="contained"
            disabled={deleting}
            onClick={confirmDelete}
          >
            {t('mailTemplates.edit.delete')}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_SYNC_MAIL-TEMPLATES',
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
