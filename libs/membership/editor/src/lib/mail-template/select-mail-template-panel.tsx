import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, IconButton, Link as MuiLink } from '@mui/material';
import {
  MailChannel,
  MailTemplateContext,
  MailTemplateListDocument,
} from '@wepublish/editor/api';
import {
  clearFilters,
  countActiveFilters,
  DataTable,
  DataTableColumn,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  IconButtonTooltip,
  Pagination,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdAddCircle, MdClose, MdUnsubscribe } from 'react-icons/md';
import {
  TemplateFilters,
  templateFilterFields,
  useTemplateColumns,
  useTemplateSortLabels,
} from './template-columns';
import {
  filterTemplates,
  pageOf,
  sortTemplates,
  TEMPLATE_SORT_FIELDS,
  TemplateFilter,
  TemplateRow,
} from './template-table';
import { templatesForChannel } from './template-versions';
import { useLetterChannel } from './use-letter-channel';

const Filters = styled.div`
  flex-shrink: 0;
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-items: start;
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  & > :first-child {
    width: 100%;
  }
`;

// The filters and the pagination stay put; only the table between them
// scrolls, so paging is in reach however many rows a page has.
const Body = styled(DrawerBody)`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const TableArea = styled.div`
  flex: 1;
  /* On a very low window the drawer body scrolls instead. */
  min-height: 200px;
`;

const Paging = styled.div`
  flex-shrink: 0;
`;

// The stationery and its extra pages matter when a template is written, not
// when one is picked for an event.
const LEFT_OUT = ['letterLayoutName', 'letterAppendixName'];

export type SelectMailTemplatePanelProps = {
  /** The template the event sends now, if any. */
  selectedId?: string | null;
  /** The purpose templates for this event are written for. */
  purpose?: MailTemplateContext;
  /** What the template is chosen for, e.g. «Rechnungserstellung». */
  eventLabel: string;
  onSelect(mailTemplateId: string | null): void;
  onClose(): void;
};

/**
 * Chooses the template an automated message sends: the template table with
 * its search and filters, so there is more than a name to go by. It starts
 * narrowed to the purpose of the event; nothing is kept between openings.
 */
export function SelectMailTemplatePanel({
  selectedId,
  purpose,
  eventLabel,
  onSelect,
  onClose,
}: SelectMailTemplatePanelProps) {
  const { t } = useTranslation();
  const { paperLetters } = useLetterChannel();
  const sortLabels = useTemplateSortLabels();

  const { data, loading } = useQuery(MailTemplateListDocument);

  const [filter, setFilter] = useState<TemplateFilter>(
    purpose ? { purposes: [purpose] } : {}
  );
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'name',
    order: 'asc',
  });
  const [chosenPage, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // The email always goes out, to everyone not on another channel, so only a
  // template with an email version can be sent by an event. The one chosen
  // stays listed whatever it has.
  const offered = useMemo(
    () =>
      (data?.mailTemplates ?? []).filter(
        template =>
          template.id === selectedId ||
          templatesForChannel([template], MailChannel.Mail).length > 0
      ),
    [data, selectedId]
  );

  const matching = useMemo(
    () =>
      sortTemplates(
        filterTemplates(offered, filter),
        sort.field,
        sort.order,
        sortLabels
      ),
    [offered, filter, sort, sortLabels]
  );

  const { page, rows } = pageOf(matching, chosenPage, limit);

  const filterFields = templateFilterFields(paperLetters);
  const filterCount = countActiveFilters(filterFields, filter);

  const choose = (mailTemplateId: string | null) => {
    onSelect(mailTemplateId);
    onClose();
  };

  // What a click on a row or its button does; the current template says
  // that choosing it changes nothing.
  const selectHint = (row: TemplateRow) =>
    row.id === selectedId ?
      t('mailTemplateSelect.chooser.selectCurrent')
    : t('mailTemplateSelect.chooser.select');

  const columns: DataTableColumn<TemplateRow>[] = [
    ...useTemplateColumns({
      paperLetters,
      renderName: row => row.name,
    }).filter(column => !LEFT_OUT.includes(column.id)),
    {
      id: 'action',
      label: t('action'),
      width: 90,
      align: 'center',
      fixed: true,
      render: row => (
        <IconButtonTooltip caption={selectHint(row)}>
          <IconButton
            size="small"
            aria-label={selectHint(row)}
            onClick={event => {
              // The row chooses on click as well.
              event.stopPropagation();
              choose(row.id);
            }}
          >
            <MdAddCircle />
          </IconButton>
        </IconButtonTooltip>
      ),
    },
  ];

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>
          {t('mailTemplateSelect.chooser.title', { event: eventLabel })}
        </DrawerTitle>

        <DrawerActions>
          {selectedId && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MdUnsubscribe />}
              onClick={() => choose(null)}
            >
              {t('mailTemplateSelect.chooser.none')}
            </Button>
          )}

          <Button
            variant="text"
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <Body>
        <Filters>
          <TemplateFilters
            filter={filter}
            onChange={change => {
              setFilter(current => ({ ...current, ...change }));
              setPage(1);
            }}
            templates={offered}
            paperLetters={paperLetters}
          />

          {filterCount > 0 && (
            <Button
              size="small"
              color="inherit"
              startIcon={<MdClose />}
              onClick={() => {
                setFilter(current => clearFilters(filterFields, current));
                setPage(1);
              }}
            >
              {t('filterableList.filter.reset')}
            </Button>
          )}
        </Filters>

        <TableArea data-table-area>
          <DataTable
            data={rows}
            loading={loading && !data}
            getRowId={row => row.id}
            columns={columns}
            onRowClick={row => choose(row.id)}
            rowTitle={selectHint}
            maxHeight="100%"
            rowClassName={row =>
              row.id === selectedId ? 'highlighted-row' : undefined
            }
            sortable={TEMPLATE_SORT_FIELDS}
            sortColumn={sort.field}
            sortOrder={sort.order}
            onSort={(field, order) => {
              setSort({ field, order });
              setPage(1);
            }}
            emptyMessage={t('mailTemplates.list.noMatch')}
          />
        </TableArea>

        <Paging>
          <Pagination
            state={{ page, setPage, limit, setLimit }}
            totalCount={matching.length}
          />
        </Paging>
      </Body>

      <DrawerFooter>
        {/* In another tab: the page behind this drawer stays as it is. */}
        <MuiLink
          href="/mailtemplates/create"
          target="_blank"
          rel="noopener"
          variant="body2"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <MdAdd aria-hidden />
          {t('mailTemplateSelect.chooser.create')}
        </MuiLink>
      </DrawerFooter>
    </>
  );
}
