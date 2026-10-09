import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
} from '@mui/material';
import {
  DeleteNavigationDocument,
  FullNavigationFragment,
  NavigationListDocument,
  SlimNavigationFragment,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  DRAWER_WIDTHS,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  NavigationEditPanel,
  PaddedCell,
  PermissionControl,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Input, InputGroup, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

function NavigationList() {
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
  const [navigations, setNavigations] = useState<SlimNavigationFragment[]>([]);
  const [currentNavigation, setCurrentNavigation] =
    useState<FullNavigationFragment>();

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(NavigationListDocument, {});

  const [deleteNavigation, { loading: isDeleting }] = useMutation(
    DeleteNavigationDocument
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
    if (data?.navigations) {
      setNavigations(data.navigations);
    }
  }, [data?.navigations]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('navigation.overview.navigations')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_NAVIGATION']}>
          <ListViewActions>
            <Link to="/navigations/create">
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                disabled={isLoading}
              >
                {t('navigation.overview.newNavigation')}
              </Button>
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
          data={navigations}
        >
          <Column
            width={400}
            align="left"
            resizable
          >
            <HeaderCell>{t('navigation.overview.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullNavigationFragment>) => (
                <Link to={`/navigations/edit/${rowData.id}`}>
                  {rowData.name || t('navigation.overview.unknown')}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullNavigationFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_DELETE_NAVIGATION']}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      aria-label={t('delete')}
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
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          navigate('/navigations');
        }}
      >
        <NavigationEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false);
            navigate('/navigations');
          }}
          onSave={() => {
            setEditModalOpen(false);
            navigate('/navigations');
          }}
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
            variant="outlined"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentNavigation) return;
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
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('navigation.overview.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NAVIGATIONS',
  'CAN_GET_NAVIGATION',
  'CAN_CREATE_NAVIGATION',
  'CAN_DELETE_NAVIGATION',
])(NavigationList);
export { CheckedPermissionComponent as NavigationList };
