import { PrintIssueRowFieldsFragment } from '@wepublish/editor/api';
import { DataTable } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

const VIRTUALIZE_FROM = 200;

/** The computed rows, so the check is of the actual list, not only its totals. */
export function RunRowsTable({
  rows,
}: {
  rows: PrintIssueRowFieldsFragment[];
}) {
  const { t } = useTranslation();

  return (
    <DataTable
      data={rows}
      getRowId={(_row, index) => String(index)}
      // a Druckliste has ~1,300 rows; a Nachlieferung usually a handful
      virtualize={rows.length > VIRTUALIZE_FROM}
      maxHeight={480}
      emptyMessage={t('printIssues.rowsTable.empty')}
      columns={[
        {
          id: 'name',
          label: t('printIssues.rowsTable.name'),
          width: 240,
          alwaysVisible: true,
          render: row =>
            row.firma || [row.vorname, row.name].filter(Boolean).join(' '),
        },
        {
          id: 'place',
          label: t('printIssues.rowsTable.place'),
          width: 200,
          render: row => [row.plz, row.ort].filter(Boolean).join(' '),
        },
        {
          id: 'copies',
          label: t('printIssues.rowsTable.copies'),
          width: 90,
          align: 'right',
          render: row => row.anzahl,
        },
        {
          id: 'plan',
          label: t('printIssues.rowsTable.plan'),
          width: 180,
          render: row => row.aboTyp,
        },
        {
          id: 'status',
          label: t('printIssues.rowsTable.status'),
          width: 220,
          render: row => row.zahlungsstatus,
        },
        {
          id: 'hint',
          label: t('printIssues.rowsTable.hint'),
          width: 260,
          render: row => row.hinweis,
        },
      ]}
    />
  );
}
