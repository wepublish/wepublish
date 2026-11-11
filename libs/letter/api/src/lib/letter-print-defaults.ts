import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
} from '@prisma/client';

/** How a letter is printed and posted. Chosen per send, not per template. */
export interface LetterPrintSettings {
  addressPosition: LetterAddressPosition;
  deliveryProduct: LetterDeliveryProduct;
  printMode: LetterPrintMode;
  printSpectrum: LetterPrintSpectrum;
}

/** A layer of choices; a missing or null value leaves the layer below as is. */
export type LetterPrintChoices = {
  [K in keyof LetterPrintSettings]?: LetterPrintSettings[K] | null;
};

/** What a letter falls back to when nobody chose print options. */
export const DEFAULT_PRINT: LetterPrintSettings = {
  addressPosition: LetterAddressPosition.left,
  deliveryProduct: LetterDeliveryProduct.cheap,
  printMode: LetterPrintMode.simplex,
  printSpectrum: LetterPrintSpectrum.grayscale,
};

const KEYS = Object.keys(DEFAULT_PRINT) as (keyof LetterPrintSettings)[];

/**
 * The defaults, refined by each layer in turn: e.g. the provider's defaults,
 * then what the editor chose for a send.
 */
export function printSettings(
  ...layers: (LetterPrintChoices | null | undefined)[]
): LetterPrintSettings {
  const settings = { ...DEFAULT_PRINT };

  for (const layer of layers) {
    for (const key of KEYS) {
      const value = layer?.[key];

      if (value != null) {
        (settings as Record<string, unknown>)[key] = value;
      }
    }
  }

  return settings;
}
