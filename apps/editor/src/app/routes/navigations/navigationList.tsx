import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  DeleteNavigationDocument,
  FullNavigationFragment,
  NavigationListDocument,
} from '@wepublish/editor/api';
import {
  CanCreateNavigation,
  CanDeleteNavigation,
  CanGetNavigation,
  CanGetNavigations,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  DRAWER_WIDTHS,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  NavigationEditPanel,
  PageTitle,
  PermissionControl,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

function NavigationList() {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isCreateRoute = location.pathname.includes('create');
  const isEditRoute = location.pathname.includes('edit');

  const isEditModalOpen = isEditRoute || isCreateRoute;
  const routeEditID = isEditRoute ? id : undefined;
  const [editID, setEditID] = useState(routeEditID);
  if (isEditModalOpen && editID !== routeEditID) {
    setEditID(routeEditID);
  }
  const closeDrawer = () => navigate('/navigations');

  const [filter, setFilter] = useState('');

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentNavigation, setCurrentNavigation] =
    useState<FullNavigationFragment>();

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(NavigationListDocument, {});

  const navigations = data?.navigations ?? [];

  const [deleteNavigation, { loading: isDeleting }] = useMutation(
    DeleteNavigationDocument
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('navigation.overview.navigations')}</PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateNavigation.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/navigations/create"
              variant="contained"
              startIcon={<MdAdd />}
              disabled={isLoading}
            >
              {t('navigation.overview.newNavigation')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <TextField
              label={t('search')}
              value={filter}
              onChange={event => setFilter(event.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <MdSearch />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
          filterCount={filter ? 1 : 0}
          onResetFilters={() => {
            setFilter('');
          }}
          storageKey="navigations"
          data={navigations}
          loading={isLoading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('navigation.overview.name'),
              width: 400,
              align: 'left',
              render: rowData => (
                <Link to={`/navigations/edit/${rowData.id}`}>
                  {rowData.name || t('navigation.overview.unknown')}
                </Link>
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rowData => (
                <PermissionControl
                  qualifyingPermissions={[CanDeleteNavigation.id]}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      aria-label={`${t('delete')} ${rowData.name || t('navigation.overview.unknown')}`}
                      size="small"
                      color="error"
                      onClick={() => {
                        setCurrentNavigation(rowData as FullNavigationFragment);
                        setConfirmationDialogOpen(true);
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

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEditModalOpen}
        onClose={closeDrawer}
      >
        <NavigationEditPanel
          id={editID}
          onClose={closeDrawer}
          onSave={closeDrawer}
        />
      </Drawer>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('navigation.overview.deleteNavigation')}</DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('navigation.overview.name')}>
              {currentNavigation?.name || t('navigation.overview.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('navigation.overview.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentNavigation) {
                return;
              }
              await deleteNavigation({
                variables: { id: currentNavigation.id },
              });

              setConfirmationDialogOpen(false);
              refetch();
            }}
            color="error"
          >
            {t('navigation.overview.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetNavigations.id,
  CanGetNavigation.id,
  CanCreateNavigation.id,
  CanDeleteNavigation.id,
])(NavigationList);
export { CheckedPermissionComponent as NavigationList };
