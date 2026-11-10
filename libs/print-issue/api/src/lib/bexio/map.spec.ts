import { contactToRow, type BexioContact } from './map';
import type { BexioOrder } from './select';

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

const selected = (overrides: Partial<BexioOrder> = {}): BexioOrder => ({
  invoice: {
    id: 1,
    title: 'Jahresabos 15.03.2026–14.03.2027',
    api_reference: null,
    contact_id: 50,
    kb_item_status_id: 9,
    is_valid_from: '2026-03-01',
  },
  payerId: 50,
  recipientId: 10,
  kind: {
    id: 'gift',
    label: 'Geschenkabo',
    word: 'NW Geschenkabo',
    refersTo: 'period',
  },
  copies: 1,
  period: { from: '2026-03-15', to: '2027-03-14' },
  issue: null,
  ...overrides,
});

const payer = contact({ id: 50, name_1: 'Schenker', name_2: 'Sara' });

const lookups = {
  countries: new Map([[1, 'Schweiz']]),
  salutations: new Map([[1, 'Herr']]),
};

describe('contactToRow', () => {
  it('maps the recipient of a gift, with its period and who pays', () => {
    expect(contactToRow(contact(), selected(), lookups, payer)).toEqual({
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
      beginn: '15.03.2026',
      email: 'max@example.com',
      bemerkungen: '',
      hinweis: 'Zeitraum 15.03.2026–14.03.2027 · bezahlt von Sara Schenker',
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
      selected({
        payerId: 10,
        kind: {
          id: 'broker',
          label: 'Broker-Abo',
          word: 'NW Abo Endkund:in',
          refersTo: 'period',
        },
      }),
      { countries: lookups.countries, salutations: new Map() }
    );

    expect(row).toMatchObject({
      anrede: 'Firma',
      firma: 'Stadtbibliothek',
      vorname: '',
      name: '',
      anzahl: 1,
      aboTyp: 'Broker-Abo',
      hinweis: 'Zeitraum 15.03.2026–14.03.2027',
    });
  });

  it('marks a copy still owed after the period ended', () => {
    const row = contactToRow(
      contact(),
      selected({ owed: { delivered: 4, entitled: 6 } }),
      lookups,
      payer
    );

    expect(row.zahlungsstatus).toBe('Restexemplar 5/6');
  });

  it('names the issue for single copies, with the order day as start', () => {
    const row = contactToRow(
      contact(),
      selected({
        recipientId: 50,
        copies: 12,
        kind: {
          id: 'single',
          label: 'Einzelheft',
          word: 'Einzelheft',
          refersTo: 'issue',
        },
        issue: '6.26',
        period: null,
      }),
      lookups
    );

    expect(row.aboTyp).toBe('Einzelheft 6.26');
    expect(row.anzahl).toBe(12);
    expect(row.beginn).toBe('01.03.2026');
    expect(row.hinweis).toBe('');
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
