import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
} from '@mui/material';
import {
  AuthorListDocument,
  AuthorSort,
  DeleteAuthorDocument,
  FullAuthorFragment,
} from '@wepublish/editor/api';
import {
  AuthorEditPanel,
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
  mapTableSortTypeToGraphQLSortOrder,
  PaddedCell,
  Pagination,
  PeerAvatar,
  PermissionControl,
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Input, InputGroup, Table as RTable } from 'rsuite';
import type { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell } = RTable;

const CellSmallPadding = styled(Cell)`
  .rs-table-cell-content {
    padding: 2px;
  }
`;

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
  const [authors, setAuthors] = useState<FullAuthorFragment[]>([]);
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
    if (data?.authors?.nodes) {
      setAuthors(data.authors.nodes);
    }
  }, [data?.authors]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('authors.overview.authors')}</h2>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_AUTHOR']}>
          <ListViewActions>
            <Link to="/authors/create">
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                disabled={isLoading}
              >
                {t('authors.overview.newAuthor')}
              </Button>
            </Link>
          </ListViewActions>
        </PermissionControl>

        <ListViewFilterArea>
          <InputGroup>
            <Input
              value={filter}
              onChange={value => {
                setFilter(value);
                setPage(1);
              }}
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
          data={authors}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSort(sortColumn, sortType ?? 'asc');
            setPage(1);
          }}
        >
          <Column
            width={100}
            align="left"
            resizable
          >
            <HeaderCell>{null}</HeaderCell>
            <CellSmallPadding>
              {(rowData: RowDataType<FullAuthorFragment>) => (
                <Avatar src={rowData.image?.squareURL || undefined} />
              )}
            </CellSmallPadding>
          </Column>

          <Column
            width={300}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('authors.overview.name')}</HeaderCell>
            <Cell dataKey="name">
              {(rowData: FullAuthorFragment) => (
                <PeerAvatar peer={rowData.peer}>
                  <Link to={`/authors/edit/${rowData.id}`}>
                    {rowData.name || t('authors.overview.untitled')}
                  </Link>
                </PeerAvatar>
              )}
            </Cell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('authors.overview.created')}</HeaderCell>
            <Cell dataKey="createdAt">
              {({ createdAt }: FullAuthorFragment) =>
                t('authors.overview.createdAt', {
                  createdAt: new Date(createdAt),
                })
              }
            </Cell>
          </Column>

          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullAuthorFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_DELETE_AUTHOR']}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      aria-label={t('delete')}
                      size="small"
                      color="error"
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentAuthor(rowData as FullAuthorFragment);
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
            variant="outlined"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentAuthor) return;

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
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('authors.overview.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_AUTHORS',
  'CAN_GET_AUTHOR',
  'CAN_DELETE_AUTHOR',
  'CAN_CREATE_AUTHOR',
])(AuthorList);
export { CheckedPermissionComponent as AuthorList };
