import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  CommentFilter,
  CommentListDocument,
  CommentSort,
  CommentState,
} from '@wepublish/editor/api';
import {
  CanGetComments,
  CanTakeActionOnComment,
  CanUpdateComments,
} from '@wepublish/permissions';
import { toPlaintext } from '@wepublish/richtext';
import {
  CommentStateDropdown,
  createCheckedPermissionComponent,
  CreateCommentBtn,
  DataTable,
  IconButton,
  IconButtonTooltip,
  ListViewContainer,
  ListViewHeader,
  mapCommentStateToColor,
  mapTableSortTypeToGraphQLSortOrder,
  MultiSelectFilter,
  Pagination,
  PermissionControl,
  TableWrapper,
  useListViewState,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

const EditIcon = styled.span`
  margin-right: 4px;
`;

const StateFilter = styled(MultiSelectFilter<CommentState>)`
  min-width: 320px;
`;

const stateChipSx = (state: CommentState) => {
  const color = mapCommentStateToColor(state);

  return color ?
      { backgroundColor: `${color}.main`, color: `${color}.contrastText` }
    : undefined;
};

const commentStateOptions: {
  state: CommentState;
  label: string;
  hint?: string;
}[] = [
  { state: CommentState.Approved, label: 'comments.state.approved' },
  {
    state: CommentState.PendingApproval,
    label: 'comments.state.pendingApproval',
  },
  {
    state: CommentState.PendingUserChanges,
    label: 'comments.state.pendingUserChanges',
    hint: 'comments.overview.pendingUserChangesInfo',
  },
  { state: CommentState.Rejected, label: 'comments.state.rejected' },
];

function mapColumFieldToGraphQLField(columnField: string): CommentSort | null {
  switch (columnField) {
    case 'createdAt':
      return CommentSort.CreatedAt;
    case 'modifiedAt':
      return CommentSort.ModifiedAt;
    default:
      return null;
  }
}

const ALL_STATES = commentStateOptions.map(({ state }) => state);

const isStateFiltered = (states?: CommentState[] | null) =>
  Boolean(states?.length) && states!.length < ALL_STATES.length;

function CommentList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<CommentFilter>('comments', {
      defaultFilter: { states: ALL_STATES },
    });

  const commentListVariables = {
    take: limit,
    skip: (page - 1) * limit,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    filter,
  };

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(CommentListDocument, {
    variables: commentListVariables,
  });

  const comments = data?.comments?.nodes ?? [];

  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
      filter,
    });
  }, [filter, page, limit, sortOrder, sortField]);

  const totalPages = Math.ceil((data?.comments?.totalCount ?? 0) / limit);

  if (totalPages > 0 && page > totalPages) {
    setPage(1);
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('comments.overview.comments')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="comments"
          filters={
            <StateFilter
              label={t('comments.overview.states')}
              options={commentStateOptions.map(({ state, label, hint }) => ({
                value: state,
                label: t(label),
                hint: hint ? t(hint) : undefined,
                chipSx: stateChipSx(state),
              }))}
              value={filter.states ?? []}
              onChange={states => setFilter(f => ({ ...f, states }))}
            />
          }
          filterCount={isStateFiltered(filter.states) ? 1 : 0}
          onResetFilters={() => setFilter(f => ({ ...f, states: ALL_STATES }))}
          loading={isLoading}
          data={comments}
          getRowId={row => row.id}
          sortColumn={sortField}
          sortOrder={sortOrder}
          sortable={['modifiedAt']}
          onSort={(column, order) => {
            setSort(column, order);
            setPage(1);
          }}
          rowClassName={row => {
            switch (row?.state) {
              case CommentState.Approved:
                return 'approved';
              case CommentState.PendingApproval:
                return 'pending-approval';
              case CommentState.PendingUserChanges:
                return 'pending-user';
              case CommentState.Rejected:
                return 'rejected';
              default:
                return '';
            }
          }}
          columns={[
            {
              id: 'revisions',
              alwaysVisible: true,
              label: t('comments.overview.text'),
              width: 350,
              render: row =>
                row.revisions?.length ?
                  toPlaintext(
                    row.revisions[row.revisions.length - 1]?.text?.content
                  )
                : null,
            },
            {
              id: 'userName',
              label: t('comments.overview.userName'),
              width: 150,
              render: row => (row.user ? row.user.name : row.guestUsername),
            },
            {
              id: 'modifiedAt',
              label: t('comments.overview.updated'),
              width: 150,
              render: ({ modifiedAt }) =>
                t('comments.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt),
                }),
            },
            {
              id: 'editState',
              label: t('comments.overview.editState'),
              width: 200,
              align: 'right',
              fixed: true,
              render: row => (
                <PermissionControl
                  qualifyingPermissions={[CanTakeActionOnComment.id]}
                >
                  <CommentStateDropdown
                    comment={row}
                    size="small"
                    onStateChanged={async () => {
                      await refetch();
                    }}
                  />
                </PermissionControl>
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 140,
              align: 'center',
              fixed: true,
              render: row => (
                <PermissionControl
                  qualifyingPermissions={[CanUpdateComments.id]}
                >
                  <EditIcon>
                    <IconButtonTooltip caption={t('comments.overview.edit')}>
                      <IconButton
                        component={RouterLink}
                        to={`edit/${row.id}`}
                        aria-label={t('comments.overview.edit')}
                        size="small"
                      >
                        <MdEdit />
                      </IconButton>
                    </IconButtonTooltip>
                  </EditIcon>

                  <CreateCommentBtn
                    itemType={row.itemType}
                    itemID={row.itemID}
                    parentID={row.id}
                    size="small"
                  />
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
          totalCount={data?.comments.totalCount ?? 0}
        />
      </TableWrapper>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetComments.id,
  CanTakeActionOnComment.id,
])(CommentList);
export { CheckedPermissionComponent as CommentList };
