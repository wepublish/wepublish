import { parse } from 'csv-parse/browser/esm/sync';
import writeXlsxFile from 'write-excel-file/browser';

export type SubscriptionExportFormat = 'csv' | 'xlsx';

const COLUMN_WIDTH = 22;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}

export function exportSubscriptionsAsCsv({
  csvString,
  filename,
}: {
  csvString: string;
  filename: string;
}) {
  downloadBlob(
    new Blob([`\uFEFFsep=,\n${csvString}`], {
      type: 'text/csv;charset=utf-8;',
    }),
    `${filename}.csv`
  );
}

export async function exportSubscriptionsAsXlsx({
  csvString,
  filename,
}: {
  csvString: string;
  filename: string;
}) {
  const [headers = [], ...dataRows]: string[][] = parse(csvString, {
    // the api terminates the header row with LF and the data rows with CRLF
    recordDelimiter: ['\r\n', '\n'],
    relaxColumnCount: true,
  });

  const rows = [
    headers.map(header => ({ value: header, fontWeight: 'bold' as const })),
    ...dataRows.map(dataRow =>
      headers.map((_, index) => ({ value: dataRow[index] ?? '' }))
    ),
  ];

  await writeXlsxFile(rows, {
    columns: headers.map(() => ({ width: COLUMN_WIDTH })),
  }).toFile(`${filename}.xlsx`);
}
