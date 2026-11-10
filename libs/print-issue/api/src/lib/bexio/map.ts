import { emptyRow, type ExportRow } from '../csv/row';
import { formatDe } from '../rules/dates';
import type { SelectedInvoice } from './select';

export type BexioContact = {
  id: number;
  contact_type_id: number;
  salutation_id: number | null;
  name_1: string;
  name_2: string | null;
  street_name?: string | null;
  house_number?: string | null;
  address_addition?: string | null;
  /** the older combined address field, still filled by the importer */
  address: string | null;
  postcode: string | null;
  city: string | null;
  country_id: number | null;
  mail: string | null;
  remarks: string | null;
};

export type Lookups = {
  countries: Map<number, string>;
  salutations: Map<number, string>;
};

const COMPANY = 1;
const text = (value: string | null | undefined) => value ?? '';

export function contactToRow(
  contact: BexioContact,
  { invoice, parsed }: SelectedInvoice,
  lookups: Lookups
): ExportRow {
  const company = contact.contact_type_id === COMPANY;
  const street = text(contact.street_name);

  return {
    ...emptyRow(),
    quelle: 'bexio',
    adressnummer:
      /NeueWege-Import Adr (\S+)/.exec(text(contact.remarks))?.[1] ?? '',
    anrede:
      company ? 'Firma'
      : contact.salutation_id != null ?
        (lookups.salutations.get(contact.salutation_id) ?? '')
      : '',
    firma: company ? contact.name_1 : '',
    vorname: company ? '' : text(contact.name_2),
    name: company ? '' : contact.name_1,
    zusatz: text(contact.address_addition),
    strasse: street || (text(contact.address).split('\n')[0] ?? ''),
    hausnummer: street ? text(contact.house_number) : '',
    plz: text(contact.postcode),
    ort: text(contact.city),
    land:
      contact.country_id != null ?
        (lookups.countries.get(contact.country_id) ?? '')
      : '',
    anzahl: parsed.copies,
    aboTyp:
      parsed.kind === 'Einzelheft' && parsed.issue ?
        `Einzelheft ${parsed.issue}`
      : parsed.kind,
    beginn: formatDe(invoice.is_valid_from.slice(0, 10)),
    email: text(contact.mail),
    // the recipient of a gift is in no system; the payer gets the copies
    hinweis:
      parsed.kind === 'Geschenkabo' ?
        'Empfänger unbekannt – Zahleradresse'
      : '',
  };
}
