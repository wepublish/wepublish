import type { ExportRow } from '../csv/row';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const addressKey = (row: ExportRow): string | null => {
  if (!normalize(row.strasse) || !normalize(row.plz)) {
    return null;
  }

  return [
    normalize(row.name || row.firma),
    normalize(row.vorname),
    normalize(`${row.strasse} ${row.hausnummer}`),
    normalize(row.plz),
  ].join('|');
};

/**
 * Marks rows that share name and address, also across the two sources. Both
 * rows stay: a member who also pays a gift subscription gets both copies.
 */
export function markDuplicates(rows: ExportRow[]): ExportRow[] {
  const keys = rows.map(addressKey);
  const counts = new Map<string, number>();

  for (const key of keys) {
    if (key) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return rows.map((row, index) => {
    const key = keys[index];
    const count = key ? (counts.get(key) ?? 0) : 0;

    if (count < 2) {
      return row;
    }

    const note = `Doppelt (${count}×)`;

    return { ...row, hinweis: row.hinweis ? `${row.hinweis}; ${note}` : note };
  });
}
