import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeleteTagDocument,
  FullTagFragment,
  TagListDocument,
  TagListQueryVariables,
  TagType,
} from '@wepublish/editor/api';
import {
  CanCreateTag,
  CanDeleteTag,
  CanGetTags,
  CanUpdateTag,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  Pagination,
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Input, InputGroup, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

export type TagListProps = {
  type: TagType;
};

const { Column, HeaderCell, Cell: RCell } = RTable;

function TagList({ type }: TagListProps) {
  const { t } = useTranslation();
  const [tagToDelete, setTagToDelete] = useState<FullTagFragment | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);

  const {
    filter: tagSearch,
    setFilter: setTagSearch,
    limit,
    setLimit,
  } = useListViewState<string>(`tags:${type}`, { defaultFilter: '' });

  const tagListVariables = {
    filter: {
      type,
      tag: tagSearch || undefined,
    },
    take: limit,
    skip: (page - 1) * limit,
  } as TagListQueryVariables;

  const { data, loading, refetch } = useQuery(TagListDocument, {
    variables: tagListVariables,
  });
  const [deleteTag] = useMutation(DeleteTagDocument, {
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
            <Button
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('tags.overview.createTag')}
            </Button>
          </Link>
        </ListViewActions>

        <ListViewFilterArea>
          <InputGroup>
            <Input
              value={tagSearch}
              onChange={value => {
                setTagSearch(value);
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
          loading={loading}
          data={data?.tags?.nodes ?? []}
        >
          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('tags.overview.name')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullTagFragment>) => (
                <Link to={`edit/${rowData.id}`}>
                  {rowData.tag || t('untitled')}
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
            <PaddedCell align="center">
              {(tag: RowDataType<FullTagFragment>) => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() => setTagToDelete(tag as FullTagFragment)}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
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
          totalCount={data?.tags?.totalCount ?? 0}
        />
      </TableWrapper>

      <Dialog
        fullWidth
        open={!!tagToDelete}
        maxWidth="xs"
        onClose={() => setTagToDelete(undefined)}
      >
        <DialogTitle>{t('tags.overview.areYouSure')}</DialogTitle>

        <DialogContent>
          {tagToDelete &&
            t('tags.overview.areYouSureBody', { tag: tagToDelete.tag })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"
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
            variant="text"
            onClick={() => setTagToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
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
