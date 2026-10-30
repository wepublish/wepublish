import { useMutation, useQuery } from '@apollo/client/react';
import {
  Avatar,
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
  AuthorListDocument,
  AuthorSort,
  DeleteAuthorDocument,
  FullAuthorFragment,
} from '@wepublish/editor/api';
import {
  CanCreateAuthor,
  CanDeleteAuthor,
  CanGetAuthor,
  CanGetAuthors,
} from '@wepublish/permissions';
import {
  AuthorEditPanel,
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
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  PeerAvatar,
  PermissionControl,
  TableWrapper,
  useListViewState,
  useSeededState,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

function mapColumFieldToGraphQLField(columnField: string): AuthorSort | null {
  switch (columnField) {
    case 'createdAt':
      return AuthorSort.CreatedAt;
    case 'modifiedAt':
      return AuthorSort.ModifiedAt;
    case 'name':
      return AuthorSort.Name;
    default:
      return null;
  }
}

function AuthorList() {
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

  const [page, setPage] = useState(1);
  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<string>('authors', {
      defaultFilter: '',
      defaultSortField: 'createdAt',
    });

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState<FullAuthorFragment>();

  const authorListQueryVariables = useMemo(
    () => ({
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    }),
    [filter, limit, page, sortField, sortOrder]
  );

  const {
    data,
    loading: isLoading,
    refetch: authorListRefetch,
  } = useQuery(AuthorListDocument, {
    variables: authorListQueryVariables,
  });

  const authors = data?.authors.nodes ?? [];

  useEffect(() => {
    authorListRefetch(authorListQueryVariables);
  }, [
    filter,
    page,
    limit,
    sortOrder,
    sortField,
    authorListRefetch,
    authorListQueryVariables,
  ]);

  const [deleteAuthor, { loading: isDeleting }] = useMutation(
    DeleteAuthorDocument,
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
          <PageTitle>{t('authors.overview.authors')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateAuthor.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/authors/create"
              variant="contained"
              startIcon={<MdAdd />}
              disabled={isLoading}
            >
              {t('authors.overview.newAuthor')}
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
              onChange={event => {
                setFilter(event.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
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
            setPage(1);
          }}
          storageKey="authors"
          loading={isLoading}
          data={authors}
          getRowId={row => row.id}
          sortColumn={sortField}
          sortOrder={sortOrder}
          sortable={['name', 'createdAt']}
          onSort={(column, order) => {
            setSort(column, order);
            setPage(1);
          }}
          columns={[
            {
              id: 'image',
              label: '',
              width: 72,
              render: row => <Avatar src={row.image?.squareURL || undefined} />,
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('authors.overview.name'),
              width: 300,
              render: row => (
                <PeerAvatar peer={row.peer}>
                  <Link to={`/authors/edit/${row.id}`}>
                    {row.name || t('untitled')}
                  </Link>
                </PeerAvatar>
              ),
            },
            {
              id: 'createdAt',
              label: t('authors.overview.created'),
              width: 200,
              render: ({ createdAt }) =>
                t('authors.overview.createdAt', {
                  createdAt: new Date(createdAt),
                }),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: row => (
                <PermissionControl qualifyingPermissions={[CanDeleteAuthor.id]}>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      aria-label={t('delete')}
                      size="small"
                      color="error"
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentAuthor(row);
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

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit: limit => {
              setLimit(limit);
              setPage(1);
            },
          }}
          totalCount={data?.authors.totalCount ?? 0}
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
          navigate('/authors');
        }}
      >
        <AuthorEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false);
            navigate('/authors');
          }}
          onSave={() => {
            setEditModalOpen(false);
            navigate('/authors');
          }}
        />
      </Drawer>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('authors.overview.deleteAuthor')}</DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('authors.overview.name')}>
              {currentAuthor?.name || t('authors.overview.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('authors.overview.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentAuthor) {
                return;
              }

              await deleteAuthor({
                variables: { id: currentAuthor.id },
              });

              await authorListRefetch(authorListQueryVariables);

              setConfirmationDialogOpen(false);
            }}
            color="error"
          >
            {t('authors.overview.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetAuthors.id,
  CanGetAuthor.id,
  CanDeleteAuthor.id,
  CanCreateAuthor.id,
])(AuthorList);
export { CheckedPermissionComponent as AuthorList };
