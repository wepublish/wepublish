import { useApolloClient, useMutation } from '@apollo/client/react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  DocumentListDocument,
  MailTemplateContext,
  MailTemplateDocument,
  MemberPlanDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import {
  getFieldByLabel,
  renderEditorForm,
} from '@wepublish/form/editor/testing';
import type { Mock } from 'vitest';

import { GiftCodeOfferEditView } from './giftCodeOfferEditView';

const plan = {
  id: 'plan-1',
  name: 'Jahresabo',
  currency: 'CHF',
  periodicityPricing: [
    {
      periodicity: PaymentPeriodicity.Yearly,
      amountMin: 9000,
      amountTarget: 12000,
      amountMax: null,
    },
  ],
  extendable: true,
  availablePaymentMethods: [
    {
      paymentMethods: [{ id: 'method-3', name: 'Rechnung', active: true }],
      paymentPeriodicities: [PaymentPeriodicity.Yearly],
      forceAutoRenewal: false,
    },
  ],
};

let planOverrides: Record<string, unknown> = {};

const offer = {
  __typename: 'GiftCodeOffer',
  id: 'offer-1',
  createdAt: '2026-10-01T10:00:00.000Z',
  modifiedAt: '2026-10-02T10:00:00.000Z',
  name: 'Ein Jahr schenken',
  description: null,
  active: true,
  allowDiscountCodes: true,
  periodicity: PaymentPeriodicity.Yearly,
  redemptionWindowMonths: 12,
  imageID: null,
  image: null,
  memberPlanId: 'plan-1',
  memberPlan: { id: 'plan-1', name: 'Jahresabo', currency: 'CHF' },
  paymentMethodIds: ['method-1'],
  paymentMethods: [{ id: 'method-1', name: 'Stripe', slug: 'stripe' }],
  autoRenew: true,
  renewalPaymentMethodId: 'method-3',
  renewalPaymentMethod: { id: 'method-3', name: 'Rechnung' },
  price: 9900,
  purchaseMailTemplateId: 'tpl-bought',
  redemptionMailTemplateId: null,
};

const mailTemplates = [
  {
    id: 'tpl-bought',
    name: 'Gutschein gekauft',
    context: MailTemplateContext.GiftCodePurchase,
    attachmentIds: ['doc-voucher', 'doc-terms'],
  },
  {
    id: 'tpl-redeemed',
    name: 'Gutschein eingelöst',
    context: MailTemplateContext.GiftCodeRedemption,
    attachmentIds: [],
  },
];

const documents = [
  { id: 'doc-voucher', title: 'Geschenkurkunde', filename: 'urkunde.docx' },
  { id: 'doc-terms', title: null, filename: 'agb.docx' },
];

const features = vi.fn(() => new Set<string>());

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
  useQuery: (document: unknown) => {
    if (document === MemberPlanDocument) {
      return {
        data: { memberPlan: { ...plan, ...planOverrides } },
        loading: false,
      };
    }

    if (document === MailTemplateDocument) {
      return { data: { mailTemplates }, loading: false };
    }

    if (document === DocumentListDocument) {
      return { data: { documents: { nodes: documents } }, loading: false };
    }

    if (document === PaymentMethodListDocument) {
      return {
        data: {
          paymentMethods: [
            { id: 'method-1', name: 'Stripe', slug: 'stripe', active: true },
          ],
        },
        loading: false,
      };
    }

    return { data: undefined, loading: false };
  },
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: () => ({ id: 'offer-1' }),
  useNavigate: () => navigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  useFeature: (feature: string) => features().has(feature),
  RichTextBlock: () => null,
  SelectMemberPlan: () => null,
}));

const navigate = vi.fn();
const mockedUseMutation = useMutation as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;
const updateOffer = vi.fn();
const query = vi.fn();

const renderView = () =>
  renderEditorForm(<GiftCodeOfferEditView />, {
    route: '/gift-codes/offers/edit/offer-1',
  });

beforeEach(() => {
  planOverrides = {};
  features.mockReturnValue(new Set());
  navigate.mockReset();
  updateOffer.mockReset();
  updateOffer.mockResolvedValue({ data: { updateGiftCodeOffer: offer } });
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([updateOffer, { loading: false }]);

  query.mockReset();
  query.mockResolvedValue({ data: { giftCodeOffer: offer } });
  mockedUseApolloClient.mockReturnValue({ query });
});

describe('GiftCodeOfferEditView', () => {
  it('opens on the offer it was asked for', async () => {
    renderView();

    expect(
      await screen.findByDisplayValue('Ein Jahr schenken')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('99.00')).toBeInTheDocument();
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'offer-1' } })
    );
  });

  it('keeps showing a duration the plan no longer sells', async () => {
    planOverrides = {
      availablePaymentMethods: [
        {
          paymentMethods: [{ id: 'method-3', name: 'Rechnung', active: true }],
          paymentPeriodicities: [PaymentPeriodicity.Monthly],
          forceAutoRenewal: false,
        },
      ],
    };
    renderView();

    expect(
      await screen.findByRole('combobox', {
        name: /^giftCodeOffer\.form\.periodicity/,
      })
    ).toHaveTextContent('memberPlanList.paymentPeriodicity.yearly');
    expect(
      screen.getByText('giftCodeOffer.form.priceHelp')
    ).toBeInTheDocument();
  });

  it('shows a spinner and no fields until the offer has loaded', () => {
    query.mockReturnValue(new Promise(() => undefined));

    renderView();

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('goes back to the offers after save and close', async () => {
    renderView();

    await screen.findByDisplayValue('Ein Jahr schenken');
    fireEvent.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/gift-codes/offers')
    );
  });

  it('stays on the offer after save', async () => {
    renderView();

    await screen.findByDisplayValue('Ein Jahr schenken');
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updateOffer).toHaveBeenCalled());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('saves what was edited and keeps the rest', async () => {
    renderView();

    fireEvent.change(await screen.findByDisplayValue('Ein Jahr schenken'), {
      target: { value: 'Ein Jahr Lesefreude' },
    });
    fireEvent.change(
      getFieldByLabel(/^giftCodeOffer\.form\.redemptionWindowMonths/),
      { target: { value: '' } }
    );
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updateOffer).toHaveBeenCalledWith({
        variables: {
          id: 'offer-1',
          name: 'Ein Jahr Lesefreude',
          description: null,
          active: true,
          allowDiscountCodes: true,
          memberPlanId: 'plan-1',
          periodicity: PaymentPeriodicity.Yearly,
          redemptionWindowMonths: null,
          price: 9900,
          imageID: null,
          paymentMethodIds: ['method-1'],
          autoRenew: true,
          renewalPaymentMethodId: 'method-3',
          purchaseMailTemplateId: 'tpl-bought',
          redemptionMailTemplateId: null,
        },
      })
    );
  });

  it('shows the stored price and that it is cheaper than subscribing', async () => {
    renderView();

    expect(await screen.findByDisplayValue('99.00')).toBeInTheDocument();
    expect(
      screen.getByText(/^giftCodeOffer\.form\.priceBelowPlan/)
    ).toBeInTheDocument();
  });

  it('shows how the offer renews', async () => {
    renderView();

    expect(
      await screen.findByRole('checkbox', {
        name: 'giftCodeOffer.form.autoRenew',
      })
    ).toBeChecked();
    expect(
      screen.getByRole('combobox', {
        name: /^giftCodeOffer\.form\.renewalPaymentMethod/,
      })
    ).toHaveTextContent('Rechnung');
  });

  it('stops renewing and forgets the payment method', async () => {
    renderView();

    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'giftCodeOffer.form.autoRenew',
      })
    );
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updateOffer).toHaveBeenCalledWith({
        variables: expect.objectContaining({
          autoRenew: false,
          renewalPaymentMethodId: null,
        }),
      })
    );
  });

  describe('mails', () => {
    const mailSelect = (name: RegExp) => screen.getByRole('combobox', { name });
    const chooseMail = (name: RegExp, option: string | RegExp) => {
      fireEvent.mouseDown(mailSelect(name));
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: option,
        })
      );
    };

    it('shows which template each mail uses', async () => {
      renderView();

      await screen.findByDisplayValue('Ein Jahr schenken');

      expect(
        mailSelect(/^giftCodeOffer\.form\.purchaseMailTemplate/)
      ).toHaveTextContent(/^Gutschein gekauft/);
      expect(
        mailSelect(/^giftCodeOffer\.form\.redemptionMailTemplate/)
      ).not.toHaveTextContent(/Gutschein/);
    });

    it('names the mail type of each template', async () => {
      renderView();

      await screen.findByDisplayValue('Ein Jahr schenken');
      fireEvent.mouseDown(
        mailSelect(/^giftCodeOffer\.form\.redemptionMailTemplate/)
      );

      expect(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: /^Gutschein eingelöst \(mailTemplates\.mailTypes\.giftCodeRedemption/,
        })
      ).toBeInTheDocument();
    });

    it('saves the template chosen for a redeemed code', async () => {
      renderView();

      await screen.findByDisplayValue('Ein Jahr schenken');
      chooseMail(
        /^giftCodeOffer\.form\.redemptionMailTemplate/,
        /^Gutschein eingelöst/
      );
      fireEvent.click(screen.getByTestId('saveButton'));

      await waitFor(() =>
        expect(updateOffer).toHaveBeenCalledWith({
          variables: expect.objectContaining({
            purchaseMailTemplateId: 'tpl-bought',
            redemptionMailTemplateId: 'tpl-redeemed',
          }),
        })
      );
    });

    // The api attaches a template's documents only with paper letters on.
    describe('attachments', () => {
      const note = (count: number, names: string) =>
        `mailSend.attachments:${count},${names}`;

      it('names the documents the chosen template attaches', async () => {
        features.mockReturnValue(new Set(['paper-letters']));
        renderView();

        expect(
          await screen.findByText(note(2, 'Geschenkurkunde, agb.docx'))
        ).toBeInTheDocument();
      });

      it('follows the template chosen', async () => {
        features.mockReturnValue(new Set(['paper-letters']));
        renderView();

        await screen.findByText(note(2, 'Geschenkurkunde, agb.docx'));
        chooseMail(
          /^giftCodeOffer\.form\.purchaseMailTemplate/,
          /^Gutschein eingelöst/
        );

        await waitFor(() =>
          expect(
            screen.queryByText(note(2, 'Geschenkurkunde, agb.docx'))
          ).not.toBeInTheDocument()
        );
      });

      it('says nothing without paper letters', async () => {
        renderView();

        await screen.findByDisplayValue('Ein Jahr schenken');

        expect(screen.queryByText(/^mailSend\.attachments/)).toBeNull();
      });
    });

    it('stops sending the purchase mail', async () => {
      renderView();

      await screen.findByDisplayValue('Ein Jahr schenken');
      chooseMail(
        /^giftCodeOffer\.form\.purchaseMailTemplate/,
        'form.select.empty'
      );
      fireEvent.click(screen.getByTestId('saveButton'));

      await waitFor(() =>
        expect(updateOffer).toHaveBeenCalledWith({
          variables: expect.objectContaining({ purchaseMailTemplateId: null }),
        })
      );
    });
  });
});
