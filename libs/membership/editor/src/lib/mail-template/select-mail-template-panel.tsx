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
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-items: start;
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  & > :first-child {
    width: 100%;
  }
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
        <IconButtonTooltip caption={t('mailTemplateSelect.chooser.select')}>
          <IconButton
            size="small"
            aria-label={t('mailTemplateSelect.chooser.select')}
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

      <DrawerBody>
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

        <DataTable
          data={rows}
          loading={loading && !data}
          getRowId={row => row.id}
          columns={columns}
          onRowClick={row => choose(row.id)}
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

        <Pagination
          state={{ page, setPage, limit, setLimit }}
          totalCount={matching.length}
        />
      </DrawerBody>

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
          {t('mailTemplates.create')}
        </MuiLink>
      </DrawerFooter>
    </>
  );
}
