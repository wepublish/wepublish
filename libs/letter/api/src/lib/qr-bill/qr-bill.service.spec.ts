import {
  Currency,
  Invoice,
  InvoiceItem,
  PrismaClient,
  QrBillReferenceType,
  SettingOrganisation,
} from '@prisma/client';
import { isQRReferenceValid, isSCORReferenceValid } from 'swissqrbill/utils';
import { LetterAddress } from '../letter-provider/letter-provider.interface';
import { OrganisationService } from '../organisation/organisation.service';
import {
  buildQrReference,
  buildScorReference,
  invoiceTotalInRappen,
  QrBillError,
  QrBillInvoice,
  QrBillService,
} from './qr-bill.service';

const QR_IBAN = 'CH4431999123000889012';

const NORMAL_IBAN = 'CH5604835012345678009';

const debtor: LetterAddress = {
  name: 'Jane Doe',
  street: 'Musterstrasse',
  number: '7',
  zip: '8000',
  city: 'Zürich',
  country: 'CH',
};

function settings(
  overrides: Partial<SettingOrganisation> = {}
): SettingOrganisation {
  return {
    id: 'default',
    createdAt: new Date(),
    modifiedAt: new Date(),
    lastLoadedAt: new Date(),
    name: 'Beispiel Verlag',
    street: 'Verlagsweg',
    number: '1',
    zip: '3000',
    city: 'Bern',
    country: 'CH',
    iban: QR_IBAN,
    referenceType: QrBillReferenceType.QRR,
    ...overrides,
  };
}

function invoice(overrides: Partial<QrBillInvoice> = {}): QrBillInvoice {
  return {
    id: 'invoice-1',
    createdAt: new Date(),
    modifiedAt: new Date(),
    mail: 'jane.doe@example.com',
    dueAt: new Date(),
    description: null,
    paidAt: null,
    canceledAt: null,
    scheduledDeactivationAt: new Date(),
    manuallySetAsPaidByUserId: null,
    currency: Currency.CHF,
    subscriptionID: null,
    number: 42,
    paymentReference: null,
    items: [
      {
        id: 'item-1',
        createdAt: new Date(),
        modifiedAt: new Date(),
        name: 'Jahresmitgliedschaft',
        description: null,
        quantity: 1,
        amount: 12000,
        invoiceId: 'invoice-1',
        discountCodeId: null,
        goodieId: null,
      } as InvoiceItem,
    ],
    ...overrides,
  } as QrBillInvoice;
}

function createService(organisationSettings = settings()) {
  const prisma = {
    invoice: { update: jest.fn() },
  } as unknown as PrismaClient;

  const organisation = {
    getOrThrow: jest.fn().mockResolvedValue(organisationSettings),
  } as unknown as OrganisationService;

  return { service: new QrBillService(prisma, organisation), prisma };
}

describe('reference numbers', () => {
  it('builds a valid QR reference from an invoice number', () => {
    const reference = buildQrReference(42);

    expect(reference).toHaveLength(27);
    expect(isQRReferenceValid(reference)).toBe(true);
  });

  it('builds a valid creditor reference from an invoice number', () => {
    const reference = buildScorReference(42);

    expect(isSCORReferenceValid(reference)).toBe(true);
  });

  it('refuses an invoice number that does not fit', () => {
    expect(() => buildScorReference(Number('1'.repeat(22)))).toThrow(
      QrBillError
    );
  });
});

describe('invoiceTotalInRappen', () => {
  it('multiplies amount by quantity', () => {
    expect(
      invoiceTotalInRappen([
        { amount: 1000, quantity: 2 } as InvoiceItem,
        { amount: 500, quantity: 1 } as InvoiceItem,
      ])
    ).toBe(2500);
  });
});

describe('QrBillService', () => {
  it('renders an svg payment part', async () => {
    const { service } = createService();

    const svg = await service.build({ invoice: invoice(), debtor });

    expect(svg).toContain('<svg');
    expect(svg).toContain('210mm');
  });

  it('stores the reference on the invoice the first time', async () => {
    const { service, prisma } = createService();

    await service.build({ invoice: invoice(), debtor });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      data: { paymentReference: buildQrReference(42) },
    });
  });

  it('keeps a reference that was already assigned', async () => {
    const { service, prisma } = createService();
    const existing = buildQrReference(7);

    const reference = await service.ensurePaymentReference(
      invoice({ paymentReference: existing }) as Invoice
    );

    expect(reference).toBe(existing);
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('does not persist a reference while previewing', async () => {
    const { service, prisma } = createService();

    await service.build({
      invoice: invoice(),
      debtor,
      persistReference: false,
    });

    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('refuses a QR reference without a QR-IBAN', async () => {
    const { service } = createService(settings({ iban: NORMAL_IBAN }));

    await expect(service.build({ invoice: invoice(), debtor })).rejects.toThrow(
      QrBillError
    );
  });

  it('refuses a QR-IBAN without a QR reference', async () => {
    const { service } = createService(
      settings({ referenceType: QrBillReferenceType.SCOR })
    );

    await expect(service.build({ invoice: invoice(), debtor })).rejects.toThrow(
      QrBillError
    );
  });

  it('refuses an invalid iban', async () => {
    const { service } = createService(settings({ iban: 'CH00 0000 0000' }));

    await expect(service.build({ invoice: invoice(), debtor })).rejects.toThrow(
      QrBillError
    );
  });

  it('refuses an invoice without an amount', async () => {
    const { service } = createService();

    await expect(
      service.build({ invoice: invoice({ items: [] }), debtor })
    ).rejects.toThrow(QrBillError);
  });
});
