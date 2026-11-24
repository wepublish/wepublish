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
import { MailAttachmentRenderer } from '@wepublish/mail/api';
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
  template: Record<string, unknown> = {},
  attachmentRenderer?: MailAttachmentRenderer
) {
  const rendered: string[] = [];

  const pdfRenderer: PdfRenderer = {
    isConfigured: async () => true,
    render: async (html: string) => {
      rendered.push(html);

      return makePdf(1);
    },
    canConvertDocuments: async () => true,
    convertDocument: async () => makePdf(1),
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
    attachmentRenderer,
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
      attachment?: Buffer;
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
      attachment: props.attachment && {
        content: props.attachment,
        name: 'RE-1.pdf',
      },
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

  // The payment provider's own invoice, with its per-invoice payment slip.
  it('prints a document the caller hands in after the letter', async () => {
    const { context } = createContext();

    const pdf = await render(context, { attachment: await makePdf(2) });

    expect(await pageCount(pdf)).toBe(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prefers the handed-in document over the static appendix', async () => {
    const { context } = createContext();

    const pdf = await render(context, {
      letterAppendixId: 'qr-bill',
      attachment: await makePdf(2),
    });

    expect(await pageCount(pdf)).toBe(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pads a handed-in document to an odd page for duplex printing', async () => {
    const { context } = createContext();

    const pdf = await render(context, {
      attachment: await makePdf(2),
      printMode: LetterPrintMode.duplex,
    });

    expect(await pageCount(pdf)).toBe(4);
  });

  it('leaves out a handed-in document for a recipient abroad', async () => {
    const { context } = createContext();

    const pdf = await render(context, {
      attachment: await makePdf(2),
      country: 'DE',
    });

    expect(await pageCount(pdf)).toBe(1);
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

  it('prints a handed-in document after the letter it sends', async () => {
    const sendLetter = vi.fn().mockResolvedValue({
      providerLetterID: 'pingen-1',
      state: LetterState.submitted,
    });
    const { context } = createContext(sendLetter);

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
      attachment: { content: await makePdf(1), name: 'RE-1.pdf' },
    });

    expect(await pageCount(sendLetter.mock.calls[0][0].file)).toBe(2);
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

describe('LetterContext.sendsAutomatically', () => {
  it.each([true, false])(
    'answers what the letter provider says: %s',
    async auto => {
      const { context } = createContext();
      context.letterProvider.sendsAutomatically = async () => auto;

      await expect(context.sendsAutomatically()).resolves.toBe(auto);
    }
  );
});

describe('LetterContext.withdrawHeldLetter', () => {
  const held = {
    id: 'log-1',
    state: MailLogState.actionRequired,
    providerLetterID: 'pingen-1',
  };

  const setup = (
    log: unknown,
    remote: unknown[] | Error = [],
    deleteLetter = vi.fn().mockResolvedValue(undefined)
  ) => {
    const { context, prisma } = createContext();
    const findUnique = vi.fn().mockResolvedValue(log);
    const update = vi.fn().mockResolvedValue({});
    const getMessageStates =
      remote instanceof Error ?
        vi.fn().mockRejectedValue(remote)
      : vi.fn().mockResolvedValue(remote);

    Object.assign(prisma.mailLog, { findUnique, update });
    Object.assign(context.letterProvider, { getMessageStates, deleteLetter });

    return { context, update, getMessageStates, deleteLetter };
  };

  it('removes a letter the vendor still holds and settles its entry', async () => {
    const { context, update, getMessageStates, deleteLetter } = setup(held, [
      { providerLetterID: 'pingen-1', state: LetterState.actionRequired },
    ]);

    await expect(context.withdrawHeldLetter('log-1')).resolves.toBe(
      'withdrawn'
    );
    expect(getMessageStates).toHaveBeenCalledWith(['pingen-1']);
    expect(deleteLetter).toHaveBeenCalledWith('pingen-1');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: { state: MailLogState.canceled },
    });
  });

  // Someone fixed, sent or cancelled it at the vendor in the meantime.
  it.each([
    [LetterState.accepted, MailLogState.accepted],
    [LetterState.dispatched, MailLogState.dispatched],
    [LetterState.canceled, MailLogState.canceled],
  ])(
    'leaves a letter alone that is %s at the vendor by now, and notes that',
    async (remoteState, logState) => {
      const { context, update, deleteLetter } = setup(held, [
        {
          providerLetterID: 'pingen-1',
          state: remoteState,
          letterData: '{"status":"x"}',
        },
      ]);

      await expect(context.withdrawHeldLetter('log-1')).resolves.toBe('left');
      expect(deleteLetter).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: { state: logState, mailData: '{"status":"x"}', error: null },
      });
    }
  );

  it('takes a letter someone removed at the vendor as dealt with', async () => {
    const { context, update, deleteLetter } = setup(held, [
      { providerLetterID: 'pingen-1', state: LetterState.canceled, gone: true },
    ]);

    await expect(context.withdrawHeldLetter('log-1')).resolves.toBe('left');
    expect(deleteLetter).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: { state: MailLogState.canceled, mailData: undefined, error: null },
    });
  });

  it('leaves a letter alone whose state the vendor does not tell', async () => {
    const { context, update, deleteLetter } = setup(held, []);

    await expect(context.withdrawHeldLetter('log-1')).resolves.toBe('left');
    expect(deleteLetter).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('leaves a letter alone while the vendor cannot be asked', async () => {
    const { context, update, deleteLetter } = setup(held, new Error('down'));

    await expect(context.withdrawHeldLetter('log-1')).resolves.toBe('left');
    expect(deleteLetter).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  // Never a second copy: without the old one gone, no new one may follow.
  it('leaves a letter alone the vendor does not let go', async () => {
    const { context, update } = setup(
      held,
      [{ providerLetterID: 'pingen-1', state: LetterState.actionRequired }],
      vi.fn().mockRejectedValue(new Error('409'))
    );

    await expect(context.withdrawHeldLetter('log-1')).resolves.toBe('left');
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ['is not held', { ...held, state: MailLogState.accepted }],
    ['never reached the vendor', { ...held, providerLetterID: null }],
    ['does not exist', null],
  ])('does not ask the vendor about an entry that %s', async (_, log) => {
    const { context, getMessageStates, deleteLetter } = setup(log);

    await expect(context.withdrawHeldLetter('log-1')).resolves.toBe('left');
    expect(getMessageStates).not.toHaveBeenCalled();
    expect(deleteLetter).not.toHaveBeenCalled();
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

describe('LetterContext attachments', () => {
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

  const attachmentRenderer = (
    pages: Record<string, number> = { contract: 2, terms: 1 },
    size: [number, number] = PageSizes.A4
  ) => ({
    render: vi.fn(async (ids: string[]) =>
      Promise.all(
        ids.map(async id => {
          const doc = await PDFDocument.create();

          for (let i = 0; i < pages[id]; i++) {
            doc.addPage(size);
          }

          return {
            filename: `${id}.pdf`,
            contentType: 'application/pdf',
            content: Buffer.from(await doc.save()),
          };
        })
      )
    ),
  });

  const render = (
    context: LetterContext,
    props: {
      attachmentIds?: string[];
      letterAppendixId?: string | null;
      country?: string;
      printMode?: LetterPrintMode;
      invoice?: { name: string; content: Buffer };
    }
  ) =>
    context.renderLetter({
      template: {
        htmlContent: '<p>Hallo</p>',
        attachmentIds: props.attachmentIds,
        letterAppendixId: props.letterAppendixId,
      },
      addressPosition: LetterAddressPosition.left,
      data: { user },
      recipient: { ...recipient, country: props.country ?? 'CH' },
      printMode: props.printMode,
      attachment: props.invoice,
    });

  it('prints the attachments after the letter, filled in with its data', async () => {
    const renderer = attachmentRenderer();
    const { context } = createContext(undefined, {}, renderer);

    const pdf = await render(context, { attachmentIds: ['contract', 'terms'] });

    expect(await pageCount(pdf)).toBe(4);
    expect(renderer.render).toHaveBeenCalledWith(['contract', 'terms'], {
      user,
    });
  });

  it('starts every attachment on a sheet of its own for duplex printing', async () => {
    const { context } = createContext(undefined, {}, attachmentRenderer());

    const pdf = await render(context, {
      attachmentIds: ['contract', 'terms'],
      printMode: LetterPrintMode.duplex,
    });

    // letter, blank back, contract (two pages), terms
    expect(await pageCount(pdf)).toBe(5);
  });

  it('prints the attachments abroad too, where the QR-bill is left out', async () => {
    const { context } = createContext(undefined, {}, attachmentRenderer());

    const pdf = await render(context, {
      attachmentIds: ['terms'],
      letterAppendixId: 'qr-bill',
      country: 'DE',
    });

    expect(await pageCount(pdf)).toBe(2);
  });

  it('keeps the QR-bill last', async () => {
    const { context } = createContext(undefined, {}, attachmentRenderer());

    const pdf = await render(context, {
      attachmentIds: ['contract'],
      letterAppendixId: 'qr-bill',
      printMode: LetterPrintMode.duplex,
    });

    // letter, blank, contract (two pages), QR-bill. With the bill before the
    // contract it would be six: letter, blank, bill, blank, contract.
    expect(await pageCount(pdf)).toBe(5);
  });

  it('keeps the invoice the sender hands in last', async () => {
    const { context } = createContext(undefined, {}, attachmentRenderer());

    const pdf = await render(context, {
      attachmentIds: ['contract'],
      printMode: LetterPrintMode.duplex,
      invoice: { name: 'Rechnung.pdf', content: await makePdf(1) },
    });

    // letter, blank, contract (two pages), invoice; the other way round it
    // would be letter, blank, invoice, blank, contract.
    expect(await pageCount(pdf)).toBe(5);
  });

  it('refuses an attachment that is not A4, naming it', async () => {
    const { context } = createContext(
      undefined,
      {},
      attachmentRenderer({ terms: 1 }, PageSizes.Letter)
    );

    await expect(render(context, { attachmentIds: ['terms'] })).rejects.toThrow(
      /terms\.pdf must be A4/
    );
  });

  it('refuses attachments it has no renderer for', async () => {
    const { context } = createContext();

    await expect(render(context, { attachmentIds: ['terms'] })).rejects.toThrow(
      /attachment/i
    );
  });

  it('prints the attachments of the template it sends', async () => {
    const sendLetter = vi.fn().mockResolvedValue({
      providerLetterID: 'pingen-1',
      state: LetterState.submitted,
    });
    const { context, prisma } = createContext(
      sendLetter,
      { attachments: [{ documentId: 'contract' }] },
      attachmentRenderer()
    );

    await context.sendLetter({
      mailTemplateId: 'template-1',
      recipient: user,
      data: { user },
      print,
    });

    expect(prisma.mailTemplate.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          attachments: {
            select: { documentId: true },
            orderBy: { position: 'asc' },
          },
        },
      })
    );
    expect(await pageCount(sendLetter.mock.calls[0][0].file)).toBe(3);
  });

  it('posts nothing when an attachment cannot be rendered, and logs why', async () => {
    const sendLetter = vi.fn();
    const { context, create } = createContext(
      sendLetter,
      { attachments: [{ documentId: 'contract' }] },
      { render: vi.fn().mockRejectedValue(new Error('Gotenberg is down')) }
    );

    await expect(
      context.sendLetter({
        mailTemplateId: 'template-1',
        recipient: user,
        data: { user },
        print,
      })
    ).rejects.toThrow('Gotenberg is down');

    expect(sendLetter).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        state: MailLogState.rejected,
        error: 'Gotenberg is down',
      }),
    });
  });
});
