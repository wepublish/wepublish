import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  MailChannel,
  MailLogState,
  PrismaClient,
} from '@prisma/client';
import { LetterContext, LetterPrintSettings } from './letter-context';
import { BaseLetterProvider } from './letter-provider/base-letter-provider';
import {
  LetterAddress,
  LetterState,
} from './letter-provider/letter-provider.interface';
import { UserWithAddress } from './letter-recipient';
import { PdfRenderer } from './pdf/pdf-renderer';

const recipient: LetterAddress = {
  name: 'Jane Doe',
  street: 'Musterstrasse',
  number: '7',
  zip: '8000',
  city: 'Zürich',
  country: 'CH',
};

const user = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Doe',
  firstName: 'Jane',
  address: {
    company: null,
    streetAddress: 'Musterstrasse',
    streetAddressNumber: '7',
    streetAddress2: null,
    streetAddress2Number: null,
    zipCode: '8000',
    city: 'Zürich',
    country: 'CH',
  },
} as unknown as UserWithAddress;

const print: LetterPrintSettings = {
  addressPosition: LetterAddressPosition.left,
  deliveryProduct: LetterDeliveryProduct.cheap,
  printMode: LetterPrintMode.simplex,
  printSpectrum: LetterPrintSpectrum.grayscale,
};

function createContext(
  sendLetter: BaseLetterProvider['sendLetter'] = jest.fn().mockResolvedValue({
    providerLetterID: 'pingen-1',
    state: LetterState.submitted,
  })
) {
  const rendered: string[] = [];

  const pdfRenderer: PdfRenderer = {
    render: async (html: string) => {
      rendered.push(html);

      return Buffer.from('%PDF-1.4 rendered');
    },
  };

  const create = jest.fn();

  const prisma = {
    mailTemplate: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'template-1',
        subject: 'Ihre Rechnung',
        htmlContent: '<p>Hallo {{user_firstName}}</p>',
      }),
    },
    mailLog: { create },
  } as unknown as PrismaClient;

  const context = new LetterContext({
    letterProvider: {
      id: 'pingen',
      sendLetter,
    } as unknown as BaseLetterProvider,
    prisma,
    pdfRenderer,
  });

  return { context, rendered, create };
}

describe('LetterContext.renderLetter', () => {
  it('renders the template and the address window into one sheet', async () => {
    const { context, rendered } = createContext();

    const pdf = await context.renderLetter({
      template: { htmlContent: '<p>Hallo {{user_firstName}}</p>' },
      addressPosition: LetterAddressPosition.left,
      data: { user: { firstName: 'Jane' } },
      recipient,
    });

    expect(pdf.toString()).toContain('%PDF');
    expect(rendered[0]).toContain('<p>Hallo Jane</p>');
    expect(rendered[0]).toContain('8000 Zürich');
  });

  it('moves the address window for a right window envelope', async () => {
    const { context, rendered } = createContext();

    await context.renderLetter({
      template: { htmlContent: '<p>Hallo</p>' },
      addressPosition: LetterAddressPosition.right,
      data: {},
      recipient,
    });

    expect(rendered[0]).toContain('left: 118mm');
  });
});

describe('LetterContext.sendLetter', () => {
  it('posts the rendered letter and logs it on the letter channel', async () => {
    const sendLetter = jest.fn().mockResolvedValue({
      providerLetterID: 'pingen-1',
      state: LetterState.submitted,
    });
    const { context, create } = createContext(sendLetter);

    const mailLogId = await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
      mailSendJobId: 'job-1',
    });

    expect(sendLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryProduct: 'cheap',
        printMode: 'simplex',
        printSpectrum: 'grayscale',
        addressPosition: 'left',
      })
    );

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: mailLogId,
        channel: MailChannel.letter,
        state: MailLogState.submitted,
        providerLetterID: 'pingen-1',
        subject: 'Ihre Rechnung',
        addressSnapshot: expect.objectContaining({ city: 'Zürich' }),
      }),
    });
  });

  it('logs a rejected letter and rethrows when the vendor fails', async () => {
    const { context, create } = createContext(
      jest.fn().mockRejectedValue(new Error('vendor down'))
    );

    await expect(
      context.sendLetter({
        mailTemplateId: 'template-1',
        recipient: user,
        data: { user },
        print,
      })
    ).rejects.toThrow('vendor down');

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        state: MailLogState.rejected,
        error: 'vendor down',
      }),
    });
  });

  it('refuses a recipient without a usable address', async () => {
    const { context } = createContext();

    await expect(
      context.sendLetter({
        mailTemplateId: 'template-1',
        recipient: { ...user, address: null } as UserWithAddress,
        data: {},
        print,
      })
    ).rejects.toThrow('has no address');
  });
});
