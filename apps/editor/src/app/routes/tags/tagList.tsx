import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
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
  DataTable,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  TableWrapper,
  useListViewState,
  useTableExportQuery,
  PageTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

export type TagListProps = {
  type: TagType;
};

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
  const exportTags = useTableExportQuery(
    TagListDocument,
    { filter: tagListVariables.filter },
    data => data.tags
  );

  const [deleteTag] = useMutation(DeleteTagDocument, {
    onCompleted() {
      refetch();
    },
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('tags.overview.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="create"
            variant="contained"
            startIcon={<MdAdd />}
          >
            {t('tags.overview.createTag')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="tags"
          filters={
            <TextField
              label={t('tags.overview.name')}
              value={tagSearch}
              onChange={event => {
                setTagSearch(event.target.value);
                setPage(1);
              }}
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
          filterCount={tagSearch ? 1 : 0}
          onResetFilters={() => {
            setTagSearch('');
            setPage(1);
          }}
          data={data?.tags?.nodes ?? []}
          exportRows={exportTags}
          exportTotalCount={data?.tags?.totalCount ?? 0}
          exportFilename={`tags-${type.toLowerCase()}`}
          loading={loading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('tags.overview.name'),
              width: 300,
              render: rowData => (
                <Link to={`edit/${rowData.id}`}>
                  {rowData.tag || t('untitled')}
                </Link>
              ),
              exportValue: rowData => rowData.tag,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: tag => (
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
            variant="text"
            onClick={() => setTagToDelete(undefined)}
          >
            {t('cancel')}
          </Button>

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
