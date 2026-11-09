import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  MailChannel,
  MailLogState,
  MailLogType,
  PrismaClient,
} from '@prisma/client';
import { PageSizes, PDFDocument } from 'pdf-lib';
import { LetterContext, LetterPrintSettings } from './letter-context';
import { BaseLetterProvider } from './letter-provider/base-letter-provider';
import {
  LetterAddress,
  LetterState,
} from './letter-provider/letter-provider.interface';
import { UserWithAddress } from './letter-recipient';
import { PdfRenderer } from './pdf/pdf-renderer';
import type { Mock } from 'vitest';

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

const makePdf = async (pages: number) => {
  const doc = await PDFDocument.create();

  for (let i = 0; i < pages; i++) {
    doc.addPage(PageSizes.A4);
  }

  return Buffer.from(await doc.save());
};

const pageCount = async (pdf: Buffer) =>
  (await PDFDocument.load(pdf)).getPageCount();

function createContext(
  sendLetter: BaseLetterProvider['sendLetter'] = vi.fn().mockResolvedValue({
    providerLetterID: 'pingen-1',
    state: LetterState.submitted,
  }),
  template: Record<string, unknown> = {}
) {
  const rendered: string[] = [];

  const pdfRenderer: PdfRenderer = {
    isConfigured: async () => true,
    render: async (html: string) => {
      rendered.push(html);

      return makePdf(1);
    },
  };

  const create = vi.fn();
  const documentUrl = vi.fn(async (id: string) => `https://media/${id}.pdf`);

  const layouts = {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
  };

  const providerSettings = { findUnique: vi.fn().mockResolvedValue(null) };

  const prisma = {
    mailTemplate: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'template-1',
        subject: 'Ihre Rechnung',
        htmlContent: '<p>Hallo {{user_firstName}}</p>',
        letterLayoutId: null,
        letterAppendixId: null,
        ...template,
      }),
    },
    letterLayout: layouts,
    settingLetterProvider: providerSettings,
    mailLog: { create },
  } as unknown as PrismaClient;

  const context = new LetterContext({
    letterProvider: {
      id: 'pingen',
      sendLetter,
      isConfigured: async () => true,
    } as unknown as BaseLetterProvider,
    prisma,
    pdfRenderer,
    documentUrl,
  });

  return {
    context,
    rendered,
    create,
    prisma,
    layouts,
    documentUrl,
    providerSettings,
  };
}

describe('LetterContext automated sends', () => {
  const sendLetter = () =>
    vi.fn().mockResolvedValue({
      providerLetterID: 'pingen-1',
      state: LetterState.submitted,
    });

  it('logs under the identifier and type an automated send hands in', async () => {
    const { context, create } = createContext(sendLetter());

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
      log: {
        mailIdentifier: 'subscriptionFlow-run-3-template-1-user-1',
        type: MailLogType.subscriptionFlow,
      },
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mailIdentifier: 'subscriptionFlow-run-3-template-1-user-1',
        type: MailLogType.subscriptionFlow,
      }),
    });
  });

  it('logs a manual send under its own id, as before', async () => {
    const { context, create } = createContext(sendLetter());

    const mailLogId = await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mailIdentifier: mailLogId,
        type: MailLogType.manual,
      }),
    });
  });

  it('prints with the provider defaults when nobody chose print options', async () => {
    const send = sendLetter();
    const { context, providerSettings } = createContext(send);
    providerSettings.findUnique.mockResolvedValue({
      defaultPrintMode: LetterPrintMode.duplex,
      defaultAddressPosition: null,
      defaultDeliveryProduct: null,
      defaultPrintSpectrum: null,
    });

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
    });

    expect(providerSettings.findUnique).toHaveBeenCalledWith({
      where: { id: 'pingen' },
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        printMode: LetterPrintMode.duplex,
        deliveryProduct: LetterDeliveryProduct.cheap,
        addressPosition: LetterAddressPosition.left,
        printSpectrum: LetterPrintSpectrum.grayscale,
      })
    );
  });

  it('can tell whether a user has a usable address', () => {
    const { context } = createContext();

    expect(context.canReceiveLetters(user)).toBe(true);
    expect(
      context.canReceiveLetters({ ...user, address: null } as UserWithAddress)
    ).toBe(false);
  });
});

describe('LetterContext appendix', () => {
  const fetchMock = vi.fn();

  beforeEach(async () => {
    const appendix = await makePdf(1);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(appendix));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const render = (
    context: LetterContext,
    props: {
      letterAppendixId?: string | null;
      country?: string;
      printMode?: LetterPrintMode;
    }
  ) =>
    context.renderLetter({
      template: {
        htmlContent: '<p>Hallo</p>',
        letterAppendixId: props.letterAppendixId,
      },
      addressPosition: LetterAddressPosition.left,
      data: {},
      recipient: { ...recipient, country: props.country ?? 'CH' },
      printMode: props.printMode,
    });

  it('leaves the letter alone without an appendix', async () => {
    const { context } = createContext();

    expect(await pageCount(await render(context, {}))).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('appends the appendix for a recipient in Switzerland', async () => {
    const { context, documentUrl } = createContext();

    const pdf = await render(context, { letterAppendixId: 'qr-bill' });

    expect(await pageCount(pdf)).toBe(2);
    expect(documentUrl).toHaveBeenCalledWith('qr-bill');
    expect(fetchMock).toHaveBeenCalledWith('https://media/qr-bill.pdf');
  });

  it('pads to an odd page for duplex printing', async () => {
    const { context } = createContext();

    const pdf = await render(context, {
      letterAppendixId: 'qr-bill',
      printMode: LetterPrintMode.duplex,
    });

    expect(await pageCount(pdf)).toBe(3);
  });

  it('skips the appendix for a recipient abroad', async () => {
    const { context } = createContext();

    const pdf = await render(context, {
      letterAppendixId: 'qr-bill',
      country: 'DE',
    });

    expect(await pageCount(pdf)).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches each appendix only once', async () => {
    const { context } = createContext();

    await render(context, { letterAppendixId: 'qr-bill' });
    await render(context, { letterAppendixId: 'qr-bill' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails when the appendix is not a pdf', async () => {
    fetchMock.mockImplementation(async () => new Response('<html>'));
    const { context } = createContext();

    await expect(
      render(context, { letterAppendixId: 'qr-bill' })
    ).rejects.toThrow(/not a pdf/i);
  });

  it('sends the template appendix with the chosen print mode', async () => {
    const sendLetter = vi.fn().mockResolvedValue({
      providerLetterID: 'pingen-1',
      state: LetterState.submitted,
    });
    const { context } = createContext(sendLetter, {
      letterAppendixId: 'qr-bill',
    });

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print: { ...print, printMode: LetterPrintMode.duplex },
    });

    expect(await pageCount(sendLetter.mock.calls[0][0].file)).toBe(3);
  });
});

const layout = (name: string) => ({
  id: `layout-${name}`,
  name,
  headerHtml: `<b>${name} header</b>`,
  footerHtml: `<i>${name} footer</i>`,
  headerHeightMm: 30,
  footerHeightMm: 20,
  isDefault: false,
});

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

describe('LetterContext.resolveLayout', () => {
  it('takes the layout a template points at', async () => {
    const { context, layouts } = createContext();
    layouts.findUnique.mockResolvedValue(layout('invoice'));

    const resolved = await context.resolveLayout('layout-invoice');

    expect(layouts.findUnique).toHaveBeenCalledWith({
      where: { id: 'layout-invoice' },
    });
    expect(resolved?.headerHtml).toBe('<b>invoice header</b>');
  });

  it('falls back to the default layout', async () => {
    const { context, layouts } = createContext();
    layouts.findFirst.mockResolvedValue(layout('default'));

    const resolved = await context.resolveLayout(null);

    expect(layouts.findFirst).toHaveBeenCalledWith({
      where: { isDefault: true },
    });
    expect(resolved?.footerHtml).toBe('<i>default footer</i>');
  });

  it('is nothing while no layout exists', async () => {
    const { context } = createContext();

    expect(await context.resolveLayout(null)).toBeNull();
  });
});

describe('LetterContext.sendLetter', () => {
  it('prints the letter on the stationery the template points at', async () => {
    const { context, rendered, prisma, layouts } = createContext();
    (prisma.mailTemplate.findUnique as Mock).mockResolvedValue({
      id: 'template-1',
      subject: 'Ihre Rechnung',
      htmlContent: '<p>Hallo</p>',
      letterLayoutId: 'layout-invoice',
    });
    layouts.findUnique.mockResolvedValue(layout('invoice'));

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
    });

    expect(rendered[0]).toContain('<b>invoice header</b>');
    expect(rendered[0]).toContain('<i>invoice footer</i>');
  });

  it('prints on the default stationery when the template has none', async () => {
    const { context, rendered, layouts } = createContext();
    layouts.findFirst.mockResolvedValue(layout('default'));

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
    });

    expect(rendered[0]).toContain('<b>default header</b>');
  });

  it('prints without stationery while none exists', async () => {
    const { context, rendered } = createContext();

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
    });

    expect(rendered[0]).not.toContain('letter-header');
  });

  it('posts the rendered letter and logs it on the letter channel', async () => {
    const sendLetter = vi.fn().mockResolvedValue({
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
      vi.fn().mockRejectedValue(new Error('vendor down'))
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

describe('LetterContext.isConfigured', () => {
  // The registry hands in proxies that answer `in` with false while nothing is
  // loaded, so an empty object behaves like an unconfigured integration.
  const unconfigured = {} as never;

  it('is configured with a set up letter provider and pdf renderer', async () => {
    expect(await createContext().context.isConfigured()).toBe(true);
  });

  it('is not configured without a letter provider', async () => {
    const { context } = createContext();
    context.letterProvider = unconfigured;

    expect(await context.isConfigured()).toBe(false);
  });

  it('is not configured without a pdf renderer', async () => {
    const { context } = createContext();
    context.pdfRenderer = unconfigured;

    expect(await context.isConfigured()).toBe(false);
  });

  it('is not configured while the letter provider lacks its credentials', async () => {
    const { context } = createContext();
    context.letterProvider.isConfigured = async () => false;

    expect(await context.isConfigured()).toBe(false);
  });

  it('is not configured while the pdf renderer lacks its credentials', async () => {
    const { context } = createContext();
    context.pdfRenderer.isConfigured = async () => false;

    expect(await context.isConfigured()).toBe(false);
  });
});
