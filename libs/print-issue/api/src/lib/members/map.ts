import { emptyRow, type ExportRow } from '../csv/row';
import { formatDe, zurichDate } from '../rules/dates';
import type { Property, Subscription, User } from './types';

/** Members without an e-mail got one of these from the import; it is nobody's inbox. */
export const PLACEHOLDER_EMAIL_DOMAIN = '@placeholder.neuewege.ch';

const property = (properties: Property[] | undefined, key: string) =>
  properties?.find(p => p.key === key)?.value ?? '';

const text = (value: string | null | undefined) => value ?? '';

export function subscriptionToRow(
  sub: Subscription,
  user: User | undefined,
  status: { zahlungsstatus: string }
): ExportRow {
  const address = user?.address;
  const email = text(user?.email);
  const hinweise: string[] = [];

  if (email.endsWith(PLACEHOLDER_EMAIL_DOMAIN)) {
    hinweise.push('Platzhalter-E-Mail');
  }

  if (!text(address?.streetAddress) && !text(address?.zipCode)) {
    hinweise.push('Keine Adresse');
  }

  const company = text(address?.company);
  // the import clamped names to 50 characters and kept the full one aside
  const fullName = property(user?.properties, 'nw_name_full');

  return {
    ...emptyRow(),
    quelle: 'wepublish',
    adressnummer:
      property(sub.properties, 'nw_adressnummer') ||
      property(user?.properties, 'nw_adressnummer'),
    anrede: property(user?.properties, 'nw_anrede'),
    firma: company ? fullName || company : '',
    vorname: text(user?.firstName),
    name: text(user?.name),
    zusatz: [address?.streetAddress2, address?.streetAddress2Number]
      .filter(Boolean)
      .join(' '),
    strasse: text(address?.streetAddress),
    hausnummer: text(address?.streetAddressNumber),
    plz: text(address?.zipCode),
    ort: text(address?.city),
    land: text(address?.country),
    anzahl: 1,
    aboTyp: sub.memberPlan.name,
    zahlungsstatus: status.zahlungsstatus,
    beginn: formatDe(zurichDate(sub.startsAt)),
    email: email.endsWith(PLACEHOLDER_EMAIL_DOMAIN) ? '' : email,
    bemerkungen: property(user?.properties, 'nw_bemerkungen'),
    hinweis: hinweise.join('; '),
  };
}
