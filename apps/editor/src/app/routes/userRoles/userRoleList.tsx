import {
  FullUserRoleFragment,
  useDeleteUserRoleMutation,
  useUserRoleListQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  PermissionControl,
  Table,
  TableWrapper,
  UserRoleEditPanel,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Drawer,
  Input,
  InputGroup,
  Modal,
  Table as RTable,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([]);
  const [currentUserRole, setCurrentUserRole] =
    useState<FullUserRoleFragment>();

  const {
    data,
    refetch,
    loading: isLoading,
  } = useUserRoleListQuery({
    variables: {
      filter: filter || undefined,
      take: 200,
    },
  });

  const [deleteUserRole, { loading: isDeleting }] = useDeleteUserRoleMutation(
    {}
  );

  useEffect(() => {
    if (isCreateRoute) {
      setEditID(undefined);
      setEditModalOpen(true);
    }

    if (isEditRoute) {
      setEditID(id);
      setEditModalOpen(true);
    }
  }, [location]);

  useEffect(() => {
    if (data?.userRoles?.nodes) {
      setUserRoles(data.userRoles.nodes);
    }
  }, [data?.userRoles]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('userRoles.overview.userRoles')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_USER_ROLE']}>
          <ListViewActions>
            <Link to="/userroles/create">
              <IconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdAdd />}
              >
                {t('userRoles.overview.newUserRole')}
              </IconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>
        <ListViewFilterArea>
          <InputGroup>
            <Input
              value={filter}
              onChange={value => setFilter(value)}
            />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </ListViewFilterArea>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={userRoles}
        >
          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('userRoles.overview.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullUserRoleFragment>) => (
                <Link to={`/userroles/edit/${rowData.id}`}>
                  {rowData.name || t('userRoles.overview.untitled')}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={400}
            align="left"
            resizable
          >
            <HeaderCell>{t('userRoles.overview.description')}</HeaderCell>
            <RCell dataKey="description" />
          </Column>
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('userRoles.overview.action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullUserRoleFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_DELETE_USER_ROLE']}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      disabled={rowData.systemRole}
                      circle
                      appearance="ghost"
                      color="red"
                      size="sm"
                      icon={<MdDelete />}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentUserRole(rowData as FullUserRoleFragment);
                      }}
                    />
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Drawer
        open={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          navigate('/userroles');
        }}
        size="sm"
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

      <Modal
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('userRoles.panels.deleteUserRole')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('userRoles.panels.name')}>
              {currentUserRole?.name || t('userRoles.panels.Unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentUserRole) return;

              await deleteUserRole({
                variables: { id: currentUserRole.id },
              });

              setConfirmationDialogOpen(false);
              refetch();
            }}
            color="red"
          >
            {t('userRoles.panels.confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('userRoles.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_USER_ROLES',
  'CAN_GET_USER_ROLE',
  'CAN_CREATE_USER_ROLE',
  'CAN_DELETE_USER_ROLE',
])(UserRoleList);
export { CheckedPermissionComponent as UserRoleList };
