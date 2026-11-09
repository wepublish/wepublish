import type { ExportRow } from './row';

export const COLUMNS = [
  'Quelle',
  'Adressnummer',
  'Anrede',
  'Firma',
  'Vorname',
  'Name',
  'Zusatz',
  'Strasse',
  'Hausnummer',
  'PLZ',
  'Ort',
  'Land',
  'Anzahl',
  'Abo-Typ',
  'Zahlungsstatus',
  'Beginn',
  'E-Mail',
  'Bemerkungen',
  'Hinweis',
] as const;

const FIELDS: (keyof ExportRow)[] = [
  'quelle',
  'adressnummer',
  'anrede',
  'firma',
  'vorname',
  'name',
  'zusatz',
  'strasse',
  'hausnummer',
  'plz',
  'ort',
  'land',
  'anzahl',
  'aboTyp',
  'zahlungsstatus',
  'beginn',
  'email',
  'bemerkungen',
  'hinweis',
];

const quote = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

/**
 * UTF-8 with BOM, every field quoted, `;` separated, CRLF line ends: the
 * combination Excel (de-CH) opens with umlauts and columns intact.
 */
export function toCsv(rows: ExportRow[]): string {
  const lines = [
    COLUMNS.map(quote).join(';'),
    ...rows.map(row => FIELDS.map(field => quote(row[field])).join(';')),
  ];

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
