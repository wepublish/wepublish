import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  DeleteExternalAppDocument,
  ExternalAppFragment,
  ExternalAppsDocument,
} from '@wepublish/editor/api';
import {
  CanCreateExternalApp,
  CanDeleteExternalApp,
} from '@wepublish/permissions';
import {
  DataTable,
  DescriptionList,
  DescriptionListItem,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  PermissionControl,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdExtension } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { externalAppRoutes } from './externalApp.view';
import { ExternalAppDrawer } from './externalAppDrawer';
import { ICON_REGISTRY } from './iconRegistry';

const AppName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

function AppIcon({ icon }: { icon: string | null }) {
  const Icon = ICON_REGISTRY[icon ?? '']?.icon ?? MdExtension;

  return <Icon aria-hidden />;
}

export function ExternalApps() {
  const { t } = useTranslation();

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState<ExternalAppFragment>();

  const { data, loading: isLoading } = useQuery(ExternalAppsDocument);

  const apps = data?.externalApps ?? [];

  const [deleteExternalApp, { loading: isDeleting }] = useMutation(
    DeleteExternalAppDocument,
    { refetchQueries: [ExternalAppsDocument] }
  );

  const deleteApp = async (app: ExternalAppFragment) => {
    try {
      await deleteExternalApp({ variables: { deleteExternalAppId: app.id } });
      enqueueSnackbar(t('externalAppForm.successDelete'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
    } catch (error) {
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }

    setConfirmationDialogOpen(false);
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {t('externalApps.apps')}{' '}
            <InfoTooltip text={t('externalApps.appsInfo')} />
          </PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateExternalApp.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to={externalAppRoutes.create}
              variant="contained"
              disabled={isLoading}
              startIcon={<MdAdd />}
            >
              {t('externalApps.createNew')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="external-apps"
          data={apps}
          loading={isLoading}
          emptyMessage={t('externalApps.noAppsFound')}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('externalAppForm.name'),
              width: 250,
              align: 'left',
              render: app => (
                <Link to={`/dashboard/apps/edit/${app.id}`}>
                  <AppName>
                    <AppIcon icon={app.icon} />
                    {app.name}
                  </AppName>
                </Link>
              ),
            },
            {
              id: 'url',
              label: t('externalAppForm.url'),
              width: 350,
              align: 'left',
              render: app => app.url,
            },
            {
              id: 'target',
              label: t('externalAppForm.target'),
              width: 200,
              align: 'left',
              render: app => t(`externalAppForm.targets.${app.target}`),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: app => (
                <PermissionControl
                  qualifyingPermissions={[CanDeleteExternalApp.id]}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      color="error"
                      size="small"
                      aria-label={t('delete')}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentApp(app);
                      }}
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
              ),
            },
          ]}
        />
      </TableWrapper>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>
          {t('externalAppForm.deleteConfirmationTitle')}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {t('externalAppForm.deleteConfirmationText')}
          </DialogContentText>
          <DescriptionList>
            <DescriptionListItem label={t('externalAppForm.name')}>
              {currentApp?.name}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
            autoFocus
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={isDeleting || currentApp === undefined}
            onClick={() => {
              if (currentApp !== undefined) {
                deleteApp(currentApp);
              }
            }}
          >
            {t('externalAppForm.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <ExternalAppDrawer />
    </>
  );
}
