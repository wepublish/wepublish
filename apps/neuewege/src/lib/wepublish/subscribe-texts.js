// Labels of the /abos form. Where the live Drupal Abo form had the field, its
// wording is kept (Abonnement, Persönliche Angaben, Name, Vorname, Adresse,
// PLZ, Ort, Land, E-Mail); everything else comes from the we.publish website
// translations (libs/website/translations/src/lib/de.json: subscribe.*,
// user.form.*) and libs/membership/website/src/lib/formatters/format-payment-period.ts.
export const TEXTS = {
  plans: 'Abonnement',
  periodicity: 'Zahlungsintervall',
  amount: 'Betrag',
  amountInput: 'Anderer Betrag in',
  personal: 'Persönliche Angaben',
  name: 'Name',
  firstName: 'Vorname',
  email: 'E-Mail',
  emailRepeated: 'E-Mail wiederholen',
  birthday: 'Geburtstag',
  password: 'Passwort',
  passwordRepeated: 'Passwort wiederholen',
  street: 'Adresse',
  zipCode: 'PLZ',
  city: 'Ort',
  country: 'Land',
  payment: 'Zahlungsmethode wählen',
  autoRenew: 'Automatisch erneuern',
  renewal: 'Verlängerung',
  goodie: 'Goodie wählen',
  goodieNone: 'Kein Goodie',
  discountCode: 'Rabattcode',
  spamProtection: 'Spam-Schutz',
  // validation and errors
  emailsDoNotMatch: 'E-Mail-Adressen stimmen nicht überein.',
  passwordTooShort: 'Das Passwort muss mindestens 12 Zeichen lang sein.',
  passwordsDoNotMatch: 'Passwörter stimmen nicht überein.',
  amountTooLow: min => `Der Betrag muss mindestens ${min} betragen.`,
  amountTooHigh: max => `Der Betrag darf höchstens ${max} betragen.`,
  captchaMissing: 'Bitte bestätigen Sie den Spam-Schutz.',
  captchaUnavailable:
    'Der Spam-Schutz konnte nicht geladen werden. Bitte laden Sie die Seite neu.',
  emailInUse:
    'Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an, um ein Abo zu lösen:',
  login: 'Zum Login',
  generic: 'Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.',
};

// format-payment-period.ts `formatPeriodUnit`, as "pro …"
const PER_PERIOD = {
  monthly: 'pro Monat',
  quarterly: 'pro Quartal',
  biannual: 'pro Halbjahr',
  yearly: 'pro Jahr',
  biennial: 'für 2 Jahre',
  lifetime: 'einmalig',
};

// format-payment-period.ts `formatPaymentTimeline`
const TIMELINE = {
  monthly: 'monatlich',
  quarterly: 'vierteljährlich',
  biannual: 'halbjährlich',
  yearly: 'jährlich',
  biennial: 'zweijährlich',
  lifetime: 'Lebenslang',
};

export const perPeriod = periodicity =>
  PER_PERIOD[periodicity] ?? PER_PERIOD.yearly;
export const periodicityName = periodicity =>
  TIMELINE[periodicity] ?? periodicity;

// cents → the live site's price style: "CHF 80.–", "CHF 12.50"
export function formatAmount(cents, currency = 'CHF') {
  const francs = Math.floor(cents / 100);
  const rest = cents % 100;
  return `${currency} ${francs}.${rest ? String(rest).padStart(2, '0') : '–'}`;
}
