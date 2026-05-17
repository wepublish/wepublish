import {
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
  MdOpenInNew,
  MdSync,
  MdWarning,
} from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Modal, Stack } from 'rsuite';
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
  const navigate = useNavigate();
  const [templateToDelete, setTemplateToDelete] =
    useState<FullMailTemplateFragment | null>(null);

  const { data: queryData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());

  const [syncTemplates, { loading: syncing }] =
    useSynchronizeMailTemplatesMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const [deleteTemplate, { loading: deleting }] = useDeleteMailTemplateMutation(
    {
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    }
  );

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noreferrer');
  };

  const capabilities = queryData?.provider.capabilities;
  const canCreate = capabilities?.canCreateTemplates ?? false;
  const canUpdate = capabilities?.canUpdateTemplates ?? false;
  const canDelete = capabilities?.canDeleteTemplates ?? false;

  const confirmDelete = async () => {
    if (!templateToDelete) {
      return;
    }
    await deleteTemplate({ variables: { id: templateToDelete.id } });
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

        <Stack spacing={8}>
          {canCreate && (
            <PermissionControl
              showRejectionMessage={false}
              qualifyingPermissions={['CAN_CREATE_MAIL-TEMPLATES']}
            >
              <Button
                appearance="primary"
                onClick={() => navigate('/mailtemplates/create')}
              >
                <MdAdd />
                {t('mailTemplates.createNew')}
              </Button>
            </PermissionControl>
          )}

          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_SYNC_MAIL-TEMPLATES']}
          >
            <Button
              appearance="default"
              onClick={() => syncTemplates()}
            >
              <MdSync css={syncing ? iconSpin : undefined} />
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

              <TableCell align="right">
                <strong>{t('mailTemplates.actions')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {queryData &&
              queryData.mailTemplates.map(template => (
                <TableRow key={template.id.toString()}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    {template.remoteMissing ?
                      ''
                    : <Button
                        appearance="default"
                        startIcon={<MdOpenInNew />}
                        onClick={() => openInNewTab(template.url)}
                      >
                        {t('mailTemplates.view', {
                          provider: queryData?.provider.name,
                        })}
                      </Button>
                    }
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
                  <TableCell align="right">
                    <Stack
                      spacing={4}
                      justifyContent="flex-end"
                    >
                      {canUpdate && !template.remoteMissing && (
                        <PermissionControl
                          showRejectionMessage={false}
                          qualifyingPermissions={['CAN_UPDATE_MAIL-TEMPLATES']}
                        >
                          <Button
                            appearance="ghost"
                            startIcon={<MdEdit />}
                            onClick={() =>
                              navigate(`/mailtemplates/edit/${template.id}`)
                            }
                          >
                            {t('mailTemplates.edit')}
                          </Button>
                        </PermissionControl>
                      )}

                      {canDelete && (
                        <PermissionControl
                          showRejectionMessage={false}
                          qualifyingPermissions={['CAN_DELETE_MAIL-TEMPLATES']}
                        >
                          <Button
                            appearance="ghost"
                            color="red"
                            startIcon={<MdDelete />}
                            onClick={() => setTemplateToDelete(template)}
                          >
                            {t('mailTemplates.delete')}
                          </Button>
                        </PermissionControl>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
        open={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title>{t('mailTemplates.deleteModalTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('mailTemplates.deleteModalBody', {
            name: templateToDelete?.name,
            provider: queryData?.provider.name,
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="default"
            onClick={() => setTemplateToDelete(null)}
            disabled={deleting}
          >
            {t('mailTemplates.cancel')}
          </Button>
          <Button
            appearance="primary"
            color="red"
            onClick={confirmDelete}
            loading={deleting}
          >
            {t('mailTemplates.delete')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_SYNC_MAIL-TEMPLATES',
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
