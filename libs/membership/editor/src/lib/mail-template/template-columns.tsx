import styled from '@emotion/styled';
import { Chip, InputAdornment, TextField } from '@mui/material';
import { MailChannel } from '@wepublish/editor/api';
import {
  DataTableColumn,
  InfoTooltip,
  MultiSelectFilter,
} from '@wepublish/ui/editor';
import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdSearch, MdWarning } from 'react-icons/md';
import { MAIL_TYPE_LABEL_KEYS, mailTypeLabel } from './mail-placeholders';
import {
  appendixOptions,
  attachmentsText,
  DEFAULT_LAYOUT,
  layoutOptions,
  memberPlanOptions,
  NO_APPENDIX,
  TEMPLATE_FILTER_FIELDS,
  TemplateFilter,
  TemplateRow,
  TemplateSortLabels,
  WITH_ATTACHMENTS,
  WITHOUT_ATTACHMENTS,
} from './template-table';
import { VERSION_ORDER } from './template-versions';

/**
 * The columns and filters of a table of message templates, shared by the
 * template list and the chooser that picks a template for an event.
 */

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

// Columns and filters that only say something where letters exist.
const LETTER_COLUMNS = ['channels', 'letterLayoutName', 'letterAppendixName'];

const LETTER_FILTERS = ['channels', 'layouts', 'appendices'];

/** The filters there are to count and reset, with or without letters. */
export const templateFilterFields = (paperLetters: boolean) =>
  TEMPLATE_FILTER_FIELDS.filter(
    field => paperLetters || !LETTER_FILTERS.includes(field)
  );

/** What sorting needs to order rows by what their cells show. */
export function useTemplateSortLabels(): TemplateSortLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      purpose: context => mailTypeLabel(context, (k, f) => t(k, f)) ?? context,
      defaultLayout: t('mailTemplates.list.letterLayoutDefault'),
    }),
    [t]
  );
}

type TemplateColumnsOptions = {
  paperLetters: boolean;
  /** The name cell: a link to the template, or just its name. */
  renderName: (row: TemplateRow) => ReactNode;
};

/** Every column but the actions, which differ from table to table. */
export function useTemplateColumns({
  paperLetters,
  renderName,
}: TemplateColumnsOptions): DataTableColumn<TemplateRow>[] {
  const { t } = useTranslation();

  const hasLetter = (row: TemplateRow) =>
    row.channels.includes(MailChannel.Letter);

  const columns: DataTableColumn<TemplateRow>[] = [
    {
      id: 'name',
      alwaysVisible: true,
      label: t('mailTemplates.name'),
      width: 200,
      render: renderName,
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
  ];

  return columns.filter(
    column => paperLetters || !LETTER_COLUMNS.includes(column.id)
  );
}

type TemplateFiltersProps = {
  filter: TemplateFilter;
  onChange: (change: Partial<TemplateFilter>) => void;
  /** All templates of the table: some filters offer what these use. */
  templates: TemplateRow[];
  paperLetters: boolean;
  /** Filters this table does without. */
  leftOut?: string[];
};

export function TemplateFilters({
  filter,
  onChange: changeFilter,
  templates,
  paperLetters,
  leftOut = [],
}: TemplateFiltersProps) {
  const { t } = useTranslation();

  const layoutLabel = (layout: string) =>
    layout === DEFAULT_LAYOUT ?
      t('mailTemplates.list.letterLayoutDefault')
    : layout;

  const appendixLabel = (appendix: string) =>
    appendix === NO_APPENDIX ?
      t('mailTemplates.list.letterAppendixNone')
    : appendix;

  return (
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

      {!leftOut.includes('statuses') && (
        <MultiSelectFilter
          label={t('mailTemplates.status')}
          options={STATUSES.map(status => ({
            value: status,
            label: t(`mailTemplates.list.statuses.${status}`),
          }))}
          value={filter.statuses ?? []}
          onChange={statuses => changeFilter({ statuses })}
        />
      )}

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

      {!leftOut.includes('memberPlans') && (
        <MultiSelectFilter
          label={t('mailTemplates.list.memberPlans')}
          options={memberPlanOptions(templates).map(plan => ({
            value: plan.id,
            label: plan.name,
          }))}
          value={filter.memberPlans ?? []}
          onChange={memberPlans => changeFilter({ memberPlans })}
        />
      )}
    </FilterRow>
  );
}
