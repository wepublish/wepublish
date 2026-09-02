import { registerEnumType } from '@nestjs/graphql';
import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterQrBill,
  MessageChannel,
} from '@prisma/client';

/**
 * Registered here rather than next to a model, so every enum is available no
 * matter which of the models that use them is loaded first.
 */
registerEnumType(MessageChannel, {
  name: 'MessageChannel',
  description: 'A channel a message can be sent through.',
});

registerEnumType(LetterAddressPosition, {
  name: 'LetterAddressPosition',
  description: 'Where the address window sits on the printed sheet.',
});

registerEnumType(LetterDeliveryProduct, {
  name: 'LetterDeliveryProduct',
});

registerEnumType(LetterPrintMode, {
  name: 'LetterPrintMode',
});

registerEnumType(LetterPrintSpectrum, {
  name: 'LetterPrintSpectrum',
});

registerEnumType(LetterQrBill, {
  name: 'LetterQrBill',
  description:
    'Whether a Swiss QR bill is printed, and where. It fills a fixed slot, it is not a placeholder.',
});

export {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterQrBill,
  MessageChannel,
};
