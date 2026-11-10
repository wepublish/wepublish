import { contactToRow, type BexioContact } from './map';
import type { SelectedInvoice } from './select';

const contact = (overrides: Partial<BexioContact> = {}): BexioContact => ({
  id: 10,
  contact_type_id: 2,
  salutation_id: 1,
  name_1: 'Muster',
  name_2: 'Max',
  street_name: 'Bahnhofstrasse',
  house_number: '1',
  address_addition: 'Hinterhaus',
  address: 'Bahnhofstrasse 1\nHinterhaus',
  postcode: '8001',
  city: 'Zürich',
  country_id: 1,
  mail: 'max@example.com',
  remarks: 'NeueWege-Import Adr 100',
  ...overrides,
});

const selected = (
  overrides: Partial<SelectedInvoice['parsed']> = {}
): SelectedInvoice => ({
  invoice: {
    id: 1,
    title: 'Geschenkabo 2026',
    api_reference: 'nw-rg:4711',
    contact_id: 10,
    kb_item_status_id: 7,
    is_valid_from: '2025-11-03',
  },
  parsed: { copies: 1, kind: 'Geschenkabo', year: 2026, ...overrides },
});

const lookups = {
  countries: new Map([[1, 'Schweiz']]),
  salutations: new Map([[1, 'Herr']]),
};

describe('contactToRow', () => {
  it('maps a person paying a gift subscription', () => {
    expect(contactToRow(contact(), selected(), lookups)).toEqual({
      quelle: 'bexio',
      adressnummer: '100',
      anrede: 'Herr',
      firma: '',
      vorname: 'Max',
      name: 'Muster',
      zusatz: 'Hinterhaus',
      strasse: 'Bahnhofstrasse',
      hausnummer: '1',
      plz: '8001',
      ort: 'Zürich',
      land: 'Schweiz',
      anzahl: 1,
      aboTyp: 'Geschenkabo',
      zahlungsstatus: '',
      beginn: '03.11.2025',
      email: 'max@example.com',
      bemerkungen: '',
      hinweis: 'Empfänger unbekannt – Zahleradresse',
    });
  });

  it('maps a company as Firma without a salutation lookup', () => {
    const row = contactToRow(
      contact({
        contact_type_id: 1,
        name_1: 'Stadtbibliothek',
        name_2: null,
        salutation_id: null,
      }),
      selected({ copies: 3, kind: 'Institutionelles Abo' }),
      { countries: lookups.countries, salutations: new Map() }
    );

    expect(row).toMatchObject({
      anrede: 'Firma',
      firma: 'Stadtbibliothek',
      vorname: '',
      name: '',
      anzahl: 3,
      aboTyp: 'Institutionelles Abo',
      hinweis: '',
    });
  });

  it('names the issue for single-issue orders', () => {
    const row = contactToRow(
      contact(),
      selected({
        copies: 12,
        kind: 'Einzelheft',
        issue: '6.26',
        year: undefined,
      }),
      lookups
    );

    expect(row.aboTyp).toBe('Einzelheft 6.26');
    expect(row.anzahl).toBe(12);
  });

  it('falls back to the first line of the combined address and to an empty country', () => {
    const row = contactToRow(
      contact({
        street_name: null,
        house_number: null,
        address: 'Seestrasse 5\n2. Stock',
        country_id: 99,
        remarks: null,
      }),
      selected(),
      lookups
    );

    expect(row.strasse).toBe('Seestrasse 5');
    expect(row.hausnummer).toBe('');
    expect(row.land).toBe('');
    expect(row.adressnummer).toBe('');
  });
});
