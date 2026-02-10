import styled from '@emotion/styled';
import {
  getApiClientV2,
  Tag,
  TagListQueryVariables,
  TagType,
  useDeleteTagMutation,
  useTagListQuery,
} from '@wepublish/editor/api-v2';
import {
  CanCreateTag,
  CanDeleteTag,
  CanGetTags,
  CanUpdateTag,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  IconButton as RIconButton,
  Input,
  InputGroup,
  Modal,
  Pagination,
  Table as RTable,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const IconButton = styled(RIconButton)`
  margin-left: 12px;
`;

export type TagListProps = {
  type: TagType;
};

const { Column, HeaderCell, Cell: RCell } = RTable;

function TagList({ type }: TagListProps) {
  const { t } = useTranslation();
  const [tagToDelete, setTagToDelete] = useState<Tag | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [tagSearch, setTagSearch] = useState<string>();

  const tagListVariables = {
    filter: {
      type,
      tag: tagSearch,
    },
    take: limit,
    skip: (page - 1) * limit,
  } as TagListQueryVariables;

  const client = getApiClientV2();
  const { data, loading, refetch } = useTagListQuery({
    client,
    variables: tagListVariables,
    fetchPolicy: 'cache-and-network',
  });
  const [deleteTag] = useDeleteTagMutation({
    client,
    onCompleted() {
      refetch();
    },
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('tags.overview.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <IconButton
              appearance="primary"
              loading={false}
            >
              <MdAdd />
              {t('tags.overview.createTag')}
            </IconButton>
          </Link>
        </ListViewActions>

        <ListViewFilterArea>
          <InputGroup>
            <Input
              value={tagSearch}
              onChange={value => setTagSearch(value)}
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
          loading={loading}
          data={data?.tags?.nodes ?? []}
        >
          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('tags.overview.name')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Tag>) => (
                <Link to={`edit/${rowData.id}`}>
                  {rowData.tag || 'Tag ohne Namen'}
                </Link>
              )}
            </RCell>
          </Column>

          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>{t('delete')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(tag: RowDataType<Tag>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() => setTagToDelete(tag as Tag)}
                />
              )}
            </PaddedCell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.tags?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>

      <Modal
        open={!!tagToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setTagToDelete(undefined)}
      >
        <Modal.Title>{t('tags.overview.areYouSure')}</Modal.Title>

        <Modal.Body>
          {tagToDelete &&
            t('tags.overview.areYouSureBody', { tag: tagToDelete.tag })}
        </Modal.Body>

        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              deleteTag({
                variables: {
                  id: tagToDelete?.id ?? '',
                },
              });
              setTagToDelete(undefined);
            }}
          >
            {t('tags.overview.areYouSureConfirmation')}
          </Button>

          <Button
            appearance="subtle"
            onClick={() => setTagToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetTags.id,
  CanCreateTag.id,
  CanUpdateTag.id,
  CanDeleteTag.id,
])(TagList);

export { CheckedPermissionComponent as TagList };
