import {
  Currency,
  LetterQrBill,
  PrismaClient,
  QrBillReferenceType,
  SettingOrganisation,
} from '@prisma/client';
import { LetterContext } from './letter-context';
import { BaseLetterProvider } from './letter-provider/base-letter-provider';
import { LetterAddress } from './letter-provider/letter-provider.interface';
import { OrganisationService } from './organisation/organisation.service';
import { PdfRenderer } from './pdf/pdf-renderer';
import { QrBillInvoice, QrBillService } from './qr-bill/qr-bill.service';

const recipient: LetterAddress = {
  name: 'Jane Doe',
  street: 'Musterstrasse',
  number: '7',
  zip: '8000',
  city: 'Zürich',
  country: 'CH',
};

const sender: LetterAddress = {
  name: 'Beispiel Verlag',
  street: 'Verlagsweg',
  number: '1',
  zip: '3000',
  city: 'Bern',
  country: 'CH',
};

const organisationSettings = {
  id: 'default',
  name: 'Beispiel Verlag',
  street: 'Verlagsweg',
  number: '1',
  zip: '3000',
  city: 'Bern',
  country: 'CH',
  iban: 'CH4431999123000889012',
  referenceType: QrBillReferenceType.QRR,
} as SettingOrganisation;

const invoice = {
  id: 'invoice-1',
  currency: Currency.CHF,
  number: 42,
  paymentReference: null,
  items: [{ amount: 12000, quantity: 1 }],
} as QrBillInvoice;

function createContext() {
  const rendered: string[] = [];

  const pdfRenderer: PdfRenderer = {
    render: async (html: string) => {
      rendered.push(html);

      return Buffer.from('%PDF-1.4 rendered');
    },
  };

  const prisma = {
    invoice: { update: jest.fn() },
  } as unknown as PrismaClient;

  const organisation = {
    getOrThrow: jest.fn().mockResolvedValue(organisationSettings),
    getSenderAddress: jest.fn().mockResolvedValue(sender),
  } as unknown as OrganisationService;

  const context = new LetterContext({
    letterProvider: {} as BaseLetterProvider,
    prisma,
    pdfRenderer,
    qrBill: new QrBillService(prisma, organisation),
    organisation,
  });

  return { context, rendered };
}

describe('LetterContext.renderLetter', () => {
  it('renders the template, the address window and the sender into one sheet', async () => {
    const { context, rendered } = createContext();

    const pdf = await context.renderLetter({
      template: {
        htmlContent: '<p>Hallo {{user_firstName}}</p>',
        addressPosition: 'left',
        qrBill: LetterQrBill.NONE,
      },
      data: { user: { firstName: 'Jane' } },
      recipient,
    });

    expect(pdf.toString()).toContain('%PDF');
    expect(rendered[0]).toContain('<p>Hallo Jane</p>');
    expect(rendered[0]).toContain('8000 Zürich');
    expect(rendered[0]).toContain(
      'Beispiel Verlag, Verlagsweg 1, 3000 Bern, CH'
    );
    expect(rendered[0]).not.toContain('<svg');
  });

  it('places the qr bill on the sheet when the template asks for it', async () => {
    const { context, rendered } = createContext();

    await context.renderLetter({
      template: {
        htmlContent: '<p>Rechnung</p>',
        addressPosition: 'left',
        qrBill: LetterQrBill.LAST_PAGE,
      },
      data: {},
      recipient,
      invoice,
      persistReference: false,
    });

    expect(rendered[0]).toContain('class="qr-bill"');
    expect(rendered[0]).toContain('<svg');
    // The amount as it is printed on the payment part.
    expect(rendered[0]).toContain('120.00');
  });

  it('refuses to print a qr bill without an invoice', async () => {
    const { context } = createContext();

    await expect(
      context.renderLetter({
        template: {
          htmlContent: '<p>Rechnung</p>',
          addressPosition: 'left',
          qrBill: LetterQrBill.LAST_PAGE,
        },
        data: {},
        recipient,
      })
    ).rejects.toThrow('no invoice is bound');
  });
});
