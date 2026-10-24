import { randomInt } from 'crypto';

export const GIFT_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const GIFT_CODE_LENGTH = 12;
const GIFT_CODE_GROUP = 4;
const GIFT_CODE_PATTERN = new RegExp(
  `^[${GIFT_CODE_ALPHABET}]{${GIFT_CODE_LENGTH}}$`
);

export const generateGiftCode = (
  random: (max: number) => number = randomInt
): string =>
  Array.from(
    { length: GIFT_CODE_LENGTH },
    () => GIFT_CODE_ALPHABET[random(GIFT_CODE_ALPHABET.length)]
  ).join('');

export const formatGiftCode = (code: string): string =>
  code.match(new RegExp(`.{1,${GIFT_CODE_GROUP}}`, 'g'))?.join('-') ?? code;

export const normalizeGiftCode = (input: string): string | null => {
  const code = input.toUpperCase().replace(/[\s-]/g, '');

  return GIFT_CODE_PATTERN.test(code) ? code : null;
};
