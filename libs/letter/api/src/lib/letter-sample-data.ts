import { LetterAddress } from './letter-provider/letter-provider.interface';

/**
 * Where a letter preview without a real recipient is addressed to. Kept off
 * the sample user so it does not turn into placeholders of its own.
 */
export const SAMPLE_LETTER_ADDRESS: LetterAddress = {
  name: 'Jane Doe',
  street: 'Musterstrasse',
  number: '1',
  zip: '8000',
  city: 'Zürich',
  country: 'CH',
};

/** The reader a stationery preview is written to. */
export const SAMPLE_LETTER_USER = {
  id: 'ckpqr5abc0001',
  email: 'jane.doe@example.com',
  firstName: 'Jane',
  name: 'Doe',
};

const paragraph = (n: number) =>
  `<p>Absatz ${n}: Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>`;

/**
 * A body long enough to run onto a second page, so a stationery preview shows
 * the header and footer repeating.
 */
export const SAMPLE_LETTER_BODY = `<p>Zürich, {{currentDate_date}}</p>
<h2>Musterbrief</h2>
<p>Guten Tag {{user_firstName}} {{user_name}}</p>
${Array.from({ length: 14 }, (_, i) => paragraph(i + 1)).join('\n')}
<p>Freundliche Grüsse</p>`;
