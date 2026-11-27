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
import {
  IoMdCheckmarkCircle,
  IoMdCheckmarkCircleOutline,
} from 'react-icons/io';
import { MdAdd, MdClose, MdUnsubscribe } from 'react-icons/md';
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
// when one is picked for an event; neither do its status, the plans that send
// it already and the note about it.
// Like the row headings of the other tables in this area.
const Name = styled.strong`
  font-weight: 600;
`;

const LEFT_OUT = [
  'letterLayoutName',
  'letterAppendixName',
  'status',
  'memberPlans',
  'description',
];

const LEFT_OUT_FILTERS = ['statuses', 'memberPlans'];

export type SelectMailTemplatePanelProps = {
  /** The template the event sends now, if any. */
  selectedId?: string | null;
  /** The purpose templates for this event are written for. */
  purpose?: MailTemplateContext;
  /** What the template is chosen for, e.g. «Rechnungserstellung». */
  eventLabel: string;
  /**
   * The channel the template has to be written for. An event always sends
   * the email; a manual send goes out on the channel picked for it.
   */
  channel?: MailChannel;
  /** Whether sending nothing is a choice: for an event yes, for a send no. */
  allowNone?: boolean;
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
  channel = MailChannel.Mail,
  allowNone = true,
  onSelect,
  onClose,
}: SelectMailTemplatePanelProps) {
  const { t } = useTranslation();
  const { paperLetters } = useLetterChannel();
  const sortLabels = useTemplateSortLabels();

  const { data, loading } = useQuery(MailTemplateListDocument);

  // The channel filter starts on the channel the template is chosen for, so
  // the chooser's own filters say why only these templates are offered.
  const [filter, setFilter] = useState<TemplateFilter>(() => ({
    ...(purpose ? { purposes: [purpose] } : {}),
    ...(paperLetters ? { channels: [channel] } : {}),
  }));
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'name',
    order: 'asc',
  });
  const [chosenPage, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Only a template with a version for the channel can be sent on it. For an
  // event that is the email: it always goes out, to everyone not on another
  // channel. The one chosen stays listed whatever it has.
  const offered = useMemo(
    () =>
      (data?.mailTemplates ?? []).filter(
        template =>
          template.id === selectedId ||
          templatesForChannel([template], channel).length > 0
      ),
    [data, selectedId, channel]
  );

  const matching = useMemo(() => {
    // The chosen one stays listed whatever versions it has, so the channels
    // do not filter it out; the other filters do.
    const { channels, ...others } = filter;
    const filtered = filterTemplates(offered, others).filter(
      template =>
        template.id === selectedId ||
        filterTemplates([template], { channels }).length > 0
    );

    return sortTemplates(filtered, sort.field, sort.order, sortLabels);
  }, [offered, filter, selectedId, sort, sortLabels]);

  const { page, rows } = pageOf(matching, chosenPage, limit);

  const filterFields = templateFilterFields(paperLetters).filter(
    field => !LEFT_OUT_FILTERS.includes(field)
  );
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

  const headings: Record<string, string> = {
    name: t('mailTemplateSelect.chooser.columns.template'),
    context: t('mailTemplateSelect.chooser.columns.purpose'),
  };

  const columns: DataTableColumn<TemplateRow>[] = [
    ...useTemplateColumns({
      paperLetters,
      // The name is what a row is chosen by: it reads as its heading.
      renderName: row => <Name>{row.name}</Name>,
    })
      .filter(column => !LEFT_OUT.includes(column.id))
      // Shorter headings than in the template list: the drawer is narrow.
      .map(column =>
        column.id in headings ?
          { ...column, label: headings[column.id], columnLabel: undefined }
        : column
      ),
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
            aria-pressed={row.id === selectedId}
            // Ticked for the template the event has now, an empty tick for
            // the ones that can be chosen instead.
            color={row.id === selectedId ? 'primary' : 'default'}
            onClick={event => {
              // The row chooses on click as well.
              event.stopPropagation();
              choose(row.id);
            }}
          >
            {row.id === selectedId ?
              <IoMdCheckmarkCircle data-checked="true" />
            : <IoMdCheckmarkCircleOutline data-checked="false" />}
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
          {allowNone && selectedId && (
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
            leftOut={LEFT_OUT_FILTERS}
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
