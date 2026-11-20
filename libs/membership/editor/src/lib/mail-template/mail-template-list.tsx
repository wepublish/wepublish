import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import {
  DeleteMailTemplateDocument,
  ImportMailTemplatesFromProviderDocument,
  MailChannel,
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
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  MultiSelectFilter,
  PageTitle,
  Pagination,
  PermissionControl,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdCheck,
  MdCloudDownload,
  MdDelete,
  MdEdit,
  MdSearch,
  MdWarning,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import { MAIL_TYPE_LABEL_KEYS, mailTypeLabel } from './mail-placeholders';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import {
  appendixOptions,
  attachmentsText,
  DEFAULT_LAYOUT,
  filterTemplates,
  layoutOptions,
  memberPlanOptions,
  NO_APPENDIX,
  pageOf,
  sortTemplates,
  TEMPLATE_FILTER_FIELDS,
  TEMPLATE_SORT_FIELDS,
  TemplateFilter,
  TemplateRow,
  WITH_ATTACHMENTS,
  WITHOUT_ATTACHMENTS,
} from './template-table';
import { VERSION_ORDER } from './template-versions';
import { useLetterChannel } from './use-letter-channel';

const StatusTag = styled(Chip)`
  white-space: nowrap;

  svg {
    flex-shrink: 0;
    color: var(
      --wep-state-draft-text,
      ${({ theme }) => theme.vars.palette.warning.main}
    );
  }
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};

  & > * {
    flex: 1 1 220px;
    max-width: 360px;
  }
`;

const ChipRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
  overflow: hidden;
`;

const STATUSES = ['ok', 'unused'];

// Columns that only say something where letters exist.
const LETTER_COLUMNS = ['channels', 'letterLayoutName', 'letterAppendixName'];

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
      sortTemplates(filterTemplates(templates, filter), sortField, sortOrder, {
        purpose: context =>
          mailTypeLabel(context, (k, f) => t(k, f)) ?? context,
        defaultLayout: t('mailTemplates.list.letterLayoutDefault'),
      }),
    [templates, filter, sortField, sortOrder, t]
  );

  // A filter can leave fewer pages than the one that was open.
  const { page, rows } = pageOf(matching, chosenPage, limit);

  const changeFilter = (change: Partial<TemplateFilter>) => {
    setFilter({ ...filter, ...change });
    setPage(1);
  };

  const filterFields = TEMPLATE_FILTER_FIELDS.filter(
    field =>
      paperLetters || !['channels', 'layouts', 'appendices'].includes(field)
  );

  const layoutLabel = (layout: string) =>
    layout === DEFAULT_LAYOUT ?
      t('mailTemplates.list.letterLayoutDefault')
    : layout;

  const appendixLabel = (appendix: string) =>
    appendix === NO_APPENDIX ?
      t('mailTemplates.list.letterAppendixNone')
    : appendix;

  const hasLetter = (row: TemplateRow) =>
    row.channels.includes(MailChannel.Letter);

  const columns: DataTableColumn<TemplateRow>[] = [
    {
      id: 'name',
      alwaysVisible: true,
      label: t('mailTemplates.name'),
      width: 200,
      render: row => (
        <Link to={`/mailtemplates/edit/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      id: 'context',
      columnLabel: t('mailTemplates.edit.mailType'),
      label: (
        <>
          {t('mailTemplates.edit.mailType')}{' '}
          <InfoTooltip
            text={t('mailTemplates.edit.purposeHint')}
            label={t('moreInfo')}
          />
        </>
      ),
      width: 150,
      render: row => mailTypeLabel(row.context, (k, f) => t(k, f)) ?? '—',
    },
    {
      id: 'status',
      columnLabel: t('mailTemplates.status'),
      label: (
        <>
          {t('mailTemplates.status')}{' '}
          <InfoTooltip
            text={t('mailTemplates.statusHelp')}
            label={t('moreInfo')}
          />
        </>
      ),
      width: 130,
      render: row =>
        row.status === 'ok' ?
          <MdCheck
            role="img"
            aria-label={t('ok')}
          />
        : <StatusTag
            size="small"
            icon={<MdWarning />}
            label={t(`mailTemplates.statuses.${row.status}`)}
          />,
    },
    {
      id: 'description',
      label: t('mailTemplates.description'),
      width: 200,
      render: row => row.description,
    },
    {
      id: 'subject',
      label: t('mailTemplates.subject'),
      width: 200,
      render: row => row.subject,
    },
    {
      id: 'channels',
      label: t('mailTemplates.list.channels'),
      width: 150,
      render: row => (
        <ChipRow>
          {VERSION_ORDER.filter(channel => row.channels.includes(channel)).map(
            channel => (
              <Chip
                key={channel}
                size="small"
                label={t(`deliveryMode.channel.${channel}`)}
              />
            )
          )}
        </ChipRow>
      ),
    },
    {
      id: 'letterLayoutName',
      label: t('mailTemplates.list.letterLayout'),
      width: 120,
      render: row =>
        hasLetter(row) ?
          (row.letterLayoutName ?? t('mailTemplates.list.letterLayoutDefault'))
        : '',
    },
    {
      id: 'letterAppendixName',
      label: t('mailTemplates.list.letterAppendix'),
      width: 130,
      render: row => row.letterAppendixName,
    },
    {
      id: 'attachmentNames',
      label: t('mailTemplates.list.attachments'),
      width: 150,
      render: row => attachmentsText(row),
    },
    {
      id: 'memberPlans',
      columnLabel: t('mailTemplates.list.memberPlans'),
      label: (
        <>
          {t('mailTemplates.list.memberPlans')}{' '}
          <InfoTooltip
            text={t('mailTemplates.list.memberPlansHint')}
            label={t('moreInfo')}
          />
        </>
      ),
      width: 150,
      render: row => (
        <ChipRow>
          {row.memberPlans.map(plan => (
            <Chip
              key={plan.id}
              size="small"
              variant="outlined"
              label={plan.name}
            />
          ))}
        </ChipRow>
      ),
    },
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

  const filters = (
    <FilterRow>
      <TextField
        label={t('mailTemplates.list.search')}
        value={filter.search ?? ''}
        onChange={event => changeFilter({ search: event.target.value })}
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

      <MultiSelectFilter
        label={t('mailTemplates.edit.mailType')}
        options={Object.entries(MAIL_TYPE_LABEL_KEYS).map(([value, key]) => ({
          value,
          label: t(key),
        }))}
        value={filter.purposes ?? []}
        onChange={purposes => changeFilter({ purposes })}
      />

      {paperLetters && (
        <MultiSelectFilter
          label={t('mailTemplates.list.channels')}
          options={VERSION_ORDER.map(channel => ({
            value: channel,
            label: t(`deliveryMode.channel.${channel}`),
          }))}
          value={filter.channels ?? []}
          onChange={channels => changeFilter({ channels })}
        />
      )}

      <MultiSelectFilter
        label={t('mailTemplates.status')}
        options={STATUSES.map(status => ({
          value: status,
          label: t(`mailTemplates.list.statuses.${status}`),
        }))}
        value={filter.statuses ?? []}
        onChange={statuses => changeFilter({ statuses })}
      />

      {paperLetters && (
        <MultiSelectFilter
          label={t('mailTemplates.list.letterLayout')}
          options={layoutOptions(templates).map(value => ({
            value,
            label: layoutLabel(value),
          }))}
          value={filter.layouts ?? []}
          onChange={layouts => changeFilter({ layouts })}
        />
      )}

      {paperLetters && (
        <MultiSelectFilter
          label={t('mailTemplates.list.letterAppendix')}
          options={appendixOptions(templates).map(value => ({
            value,
            label: appendixLabel(value),
          }))}
          value={filter.appendices ?? []}
          onChange={appendices => changeFilter({ appendices })}
        />
      )}

      <MultiSelectFilter
        label={t('mailTemplates.list.attachments')}
        options={[WITH_ATTACHMENTS, WITHOUT_ATTACHMENTS].map(value => ({
          value,
          label: t(`mailTemplates.list.attachmentsFilter.${value}`),
        }))}
        value={filter.attachments ?? []}
        onChange={attachments => changeFilter({ attachments })}
      />

      <MultiSelectFilter
        label={t('mailTemplates.list.memberPlans')}
        options={memberPlanOptions(templates).map(plan => ({
          value: plan.id,
          label: plan.name,
        }))}
        value={filter.memberPlans ?? []}
        onChange={memberPlans => changeFilter({ memberPlans })}
      />
    </FilterRow>
  );

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
            columns={columns.filter(
              column => paperLetters || !LETTER_COLUMNS.includes(column.id)
            )}
            filters={filters}
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
