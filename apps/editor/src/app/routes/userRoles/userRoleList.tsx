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
  DeleteUserRoleDocument,
  FullUserRoleFragment,
  UserRoleListDocument,
} from '@wepublish/editor/api';
import {
  CanCreateUserRole,
  CanDeleteUserRole,
  CanGetUserRole,
  CanGetUserRoles,
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
  PermissionControl,
  TableWrapper,
  UserRoleEditPanel,
  useSeededState,
  PageTitle,
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

function UserRoleList() {
  const { t } = useTranslation();

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isCreateRoute = location.pathname.includes('create');
  const isEditRoute = location.pathname.includes('edit');

  const [isEditModalOpen, setEditModalOpen] = useState(
    isEditRoute || isCreateRoute
  );

  const [editID, setEditID] = useState<string | undefined>(
    isEditRoute ? id : undefined
  );

  const [filter, setFilter] = useState('');

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] =
    useState<FullUserRoleFragment>();

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(UserRoleListDocument, {
    variables: {
      filter: filter || undefined,
      take: 200,
    },
  });

  const userRoles = data?.userRoles.nodes ?? [];

  const [deleteUserRole, { loading: isDeleting }] = useMutation(
    DeleteUserRoleDocument,
    {}
  );

  useSeededState(
    isCreateRoute || isEditRoute ? location.pathname : undefined,
    () => {
      setEditID(isEditRoute ? id : undefined);
      setEditModalOpen(true);
    }
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('userRoles.overview.userRoles')}</PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateUserRole.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/userroles/create"
              variant="contained"
              startIcon={<MdAdd />}
              disabled={isLoading}
            >
              {t('userRoles.overview.newUserRole')}
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
          storageKey="user-roles"
          data={userRoles}
          loading={isLoading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('userRoles.overview.name'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Link to={`/userroles/edit/${rowData.id}`}>
                  {rowData.name || t('untitled')}
                </Link>
              ),
            },
            {
              id: 'description',
              label: t('userRoles.overview.description'),
              width: 400,
              align: 'left',
              sortKey: 'description',
              render: row => row.description,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rowData => (
                <PermissionControl
                  qualifyingPermissions={[CanDeleteUserRole.id]}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      disabled={rowData.systemRole}
                      color="error"
                      size="small"
                      aria-label={t('delete')}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentUserRole(rowData as FullUserRoleFragment);
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
        onClose={() => {
          setEditModalOpen(false);
          navigate('/userroles');
        }}
      >
        <UserRoleEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false);
            navigate('/userroles');
          }}
          onSave={() => {
            setEditModalOpen(false);
            refetch();
            navigate('/userroles');
          }}
        />
      </Drawer>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('userRoles.panels.deleteUserRole')}</DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('userRoles.panels.name')}>
              {currentUserRole?.name || t('userRoles.panels.Unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('userRoles.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentUserRole) {
                return;
              }

              await deleteUserRole({
                variables: { id: currentUserRole.id },
              });

              setConfirmationDialogOpen(false);
              refetch();
            }}
            color="error"
          >
            {t('userRoles.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetUserRoles.id,
  CanGetUserRole.id,
  CanCreateUserRole.id,
  CanDeleteUserRole.id,
])(UserRoleList);
export { CheckedPermissionComponent as UserRoleList };
