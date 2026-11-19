import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import {
  DeleteMailTemplateDocument,
  ImportMailTemplatesFromProviderDocument,
  MailTemplateListDocument,
} from '@wepublish/editor/api';
import {
  clearFilters,
  countActiveFilters,
  createCheckedPermissionComponent,
  DataTable,
  DataTableColumn,
  enqueueSnackbar,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
  PermissionControl,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdCloudDownload, MdDelete, MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import {
  filterTemplates,
  pageOf,
  sortTemplates,
  TEMPLATE_SORT_FIELDS,
  TemplateFilter,
  TemplateRow,
} from './template-table';
import {
  TemplateFilters,
  templateFilterFields,
  useTemplateColumns,
  useTemplateSortLabels,
} from './template-columns';
import { useLetterChannel } from './use-letter-channel';

function MailTemplateList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { paperLetters } = useLetterChannel();

  const { data: queryData, loading } = useQuery(MailTemplateListDocument);

  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<TemplateFilter>('mailTemplates', {
      defaultSortField: 'name',
      defaultSortOrder: 'asc',
      defaultLimit: 20,
    });
  const [chosenPage, setPage] = useState(1);
  const sortLabels = useTemplateSortLabels();

  const [deleteMailTemplate] = useMutation(DeleteMailTemplateDocument, {
    ...DEFAULT_MUTATION_OPTIONS(t),
    refetchQueries: ['MailTemplate', 'MailTemplateList'],
  });
  const [importFromProvider, { loading: importing }] = useMutation(
    ImportMailTemplatesFromProviderDocument,
    {
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate', 'MailTemplateList'],
    }
  );

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const templates = useMemo(() => queryData?.mailTemplates ?? [], [queryData]);

  const matching = useMemo(
    () =>
      sortTemplates(
        filterTemplates(templates, filter),
        sortField,
        sortOrder,
        sortLabels
      ),
    [templates, filter, sortField, sortOrder, sortLabels]
  );

  // A filter can leave fewer pages than the one that was open.
  const { page, rows } = pageOf(matching, chosenPage, limit);

  const changeFilter = (change: Partial<TemplateFilter>) => {
    setFilter({ ...filter, ...change });
    setPage(1);
  };

  const filterFields = templateFilterFields(paperLetters);

  const columns: DataTableColumn<TemplateRow>[] = [
    ...useTemplateColumns({
      paperLetters,
      renderName: row => (
        <Link to={`/mailtemplates/edit/${row.id}`}>{row.name}</Link>
      ),
    }),
    {
      id: 'action',
      label: t('action'),
      width: 100,
      align: 'center',
      fixed: true,
      render: row => (
        <Stack
          direction="row"
          sx={{ justifyContent: 'center' }}
          spacing={1}
        >
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={[CanUpdateMailTemplates.id]}
          >
            <IconButtonTooltip caption={t('edit')}>
              <IconButton
                size="small"
                aria-label={t('edit')}
                onClick={() => navigate(`/mailtemplates/edit/${row.id}`)}
              >
                <MdEdit />
              </IconButton>
            </IconButtonTooltip>
          </PermissionControl>
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={[CanDeleteMailTemplates.id]}
          >
            <IconButtonTooltip caption={t('delete')}>
              <IconButton
                size="small"
                color="error"
                aria-label={t('delete')}
                onClick={() => setDeleteId(row.id)}
              >
                <MdDelete />
              </IconButton>
            </IconButtonTooltip>
          </PermissionControl>
        </Stack>
      ),
    },
  ];

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }
    try {
      await deleteMailTemplate({ variables: { id: deleteId } });
    } finally {
      setDeleteId(null);
    }
  };

  const confirmImport = async () => {
    try {
      const result = await importFromProvider();
      const count = result.data?.importMailTemplatesFromProvider ?? 0;
      enqueueSnackbar(t('mailTemplates.importDone', { count }), {
        variant: 'success',
      });
    } finally {
      setImportOpen(false);
    }
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('mailTemplates.availableTemplates')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={[CanUpdateMailTemplates.id]}
          >
            <Button
              variant="outlined"
              loading={importing}
              startIcon={<MdCloudDownload />}
              onClick={() => setImportOpen(true)}
            >
              {t('mailTemplates.importFromProvider')}
            </Button>
          </PermissionControl>

          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={[CanCreateMailTemplates.id]}
          >
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => navigate('/mailtemplates/create')}
            >
              {t('mailTemplates.create')}
            </Button>
          </PermissionControl>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Box sx={{ marginTop: 2 }}>
          <DataTable
            storageKey={paperLetters ? 'mail-templates' : 'mail-templates-mail'}
            data={rows}
            loading={loading && !queryData}
            getRowId={row => row.id}
            columns={columns}
            filters={
              <TemplateFilters
                filter={filter}
                onChange={changeFilter}
                templates={templates}
                paperLetters={paperLetters}
              />
            }
            filterCount={countActiveFilters(filterFields, filter)}
            onResetFilters={() => {
              setFilter(clearFilters(filterFields, filter));
              setPage(1);
            }}
            sortable={TEMPLATE_SORT_FIELDS}
            sortColumn={sortField}
            sortOrder={sortOrder}
            onSort={(column, order) => {
              setSort(column, order);
              setPage(1);
            }}
            emptyMessage={
              templates.length ?
                t('mailTemplates.list.noMatch')
              : t('mailTemplates.empty')
            }
          />
        </Box>

        <Pagination
          state={{ page, setPage, limit, setLimit }}
          totalCount={matching.length}
        />
      </TableWrapper>

      <Dialog
        fullWidth
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
      >
        <DialogTitle>{t('mailTemplates.delete')}</DialogTitle>
        <DialogContent>{t('mailTemplates.deleteConfirm')}</DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setDeleteId(null)}
          >
            {t('mailTemplates.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
          >
            {t('mailTemplates.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        open={importOpen}
        onClose={() => setImportOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>{t('mailTemplates.importFromProvider')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning">{t('mailTemplates.importWarning')}</Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setImportOpen(false)}
          >
            {t('mailTemplates.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            loading={importing}
            onClick={confirmImport}
          >
            {t('mailTemplates.importConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetMailTemplates.id,
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
