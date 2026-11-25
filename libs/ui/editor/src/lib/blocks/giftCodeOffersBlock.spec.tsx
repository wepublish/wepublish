import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SubscribeBlockField } from '@wepublish/editor/api';
import { SetStateAction, useState } from 'react';

import { GiftCodeOffersBlock } from './giftCodeOffersBlock';
import { GiftCodeOffersBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const useQuery = vi.hoisted(() => vi.fn());

vi.mock('@apollo/client/react', () => ({ useQuery }));

const renderedValue = vi.fn<(value: GiftCodeOffersBlockValue) => void>();
const latest = () => renderedValue.mock.lastCall![0];

const Harness = ({ value: start }: { value: GiftCodeOffersBlockValue }) => {
  const [value, setValue] = useState(start);
  renderedValue(value);

  return (
    <ThemeProvider theme={theme}>
      <GiftCodeOffersBlock
        value={value}
        onChange={(next: SetStateAction<GiftCodeOffersBlockValue>) =>
          setValue(next)
        }
      />
    </ThemeProvider>
  );
};

const initialValue = (
  overrides: Partial<GiftCodeOffersBlockValue> = {}
): GiftCodeOffersBlockValue => ({
  fields: [SubscribeBlockField.FirstName],
  giftCodeOfferIds: [],
  showDiscountCodes: false,
  askRecipientName: true,
  ...overrides,
});

describe('GiftCodeOffersBlock', () => {
  beforeEach(() => {
    useQuery.mockReturnValue({
      loading: false,
      data: {
        giftCodeOffers: {
          nodes: [
            {
              id: 'offer-1',
              name: 'Jahresabo verschenken',
              price: 12000,
              periodicity: 'yearly',
              memberPlan: { currency: 'CHF' },
            },
            {
              id: 'offer-2',
              name: 'Halbjahresabo verschenken',
              price: 6500,
              periodicity: 'biannual',
              memberPlan: { currency: 'CHF' },
            },
          ],
        },
      },
    });
  });

  it('only lists active offers', () => {
    render(<Harness value={initialValue()} />);

    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: expect.objectContaining({ filter: { active: true } }),
      })
    );
  });

  it('selects the offers to sell', () => {
    render(<Harness value={initialValue()} />);

    fireEvent.mouseDown(
      screen.getByRole('combobox', {
        name: 'blocks.giftCodeOffers.selectOffers',
      })
    );
    fireEvent.click(
      screen.getByRole('option', { name: 'Halbjahresabo verschenken' })
    );

    expect(latest().giftCodeOfferIds).toEqual(['offer-2']);
  });

  it('lists the selected offers in order with a drag handle each', () => {
    render(
      <Harness
        value={initialValue({ giftCodeOfferIds: ['offer-2', 'offer-1'] })}
      />
    );

    const rows = screen.getAllByRole('listitem');

    expect(rows.map(row => row.getAttribute('aria-label'))).toEqual([
      'Halbjahresabo verschenken',
      'Jahresabo verschenken',
    ]);
    rows.forEach(row =>
      expect(
        within(row).getByRole('button', {
          name: 'blocks.subscribe.dragToReorder',
        })
      ).toBeInTheDocument()
    );
  });

  it('picks the preselected offer with a radio when there are several', () => {
    render(
      <Harness
        value={initialValue({ giftCodeOfferIds: ['offer-2', 'offer-1'] })}
      />
    );

    const yearlyDefault = within(
      screen.getByRole('listitem', { name: 'Jahresabo verschenken' })
    ).getByRole('radio', { name: /blocks.subscribe.defaultPlanLabel/ });

    fireEvent.click(yearlyDefault);

    expect(latest().defaultGiftCodeOfferId).toBe('offer-1');
  });

  it('explains the order section and shows each offer with its price', () => {
    render(
      <Harness
        value={initialValue({ giftCodeOfferIds: ['offer-2', 'offer-1'] })}
      />
    );

    expect(
      screen.getByText('blocks.giftCodeOffers.orderHeading')
    ).toBeInTheDocument();
    expect(
      screen.getByText('blocks.giftCodeOffers.orderHelp')
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('listitem', { name: 'Jahresabo verschenken' })
      ).getByText('CHF 120.00 · memberPlanList.paymentPeriodicity.yearly')
    ).toBeInTheDocument();
  });

  it('shows the first offer as preselected until another is picked', () => {
    render(<Harness value={initialValue({ giftCodeOfferIds: ['offer-1'] })} />);

    expect(
      screen.getByRole('radio', { name: /blocks.subscribe.defaultPlanLabel/ })
    ).toBeChecked();
  });

  it('forgets the preselected offer once it is removed', () => {
    render(
      <Harness
        value={initialValue({
          giftCodeOfferIds: ['offer-2', 'offer-1'],
          defaultGiftCodeOfferId: 'offer-1',
        })}
      />
    );

    fireEvent.click(
      within(
        screen.getByRole('button', { name: 'Jahresabo verschenken' })
      ).getByTestId('CancelIcon')
    );

    expect(latest()).toMatchObject({
      giftCodeOfferIds: ['offer-2'],
      defaultGiftCodeOfferId: null,
    });
  });

  it('switches the recipient name and discount code inputs', () => {
    render(<Harness value={initialValue()} />);

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'blocks.giftCodeOffers.askRecipientName',
      })
    );
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'blocks.giftCodeOffers.showDiscountCodes',
      })
    );

    expect(latest()).toMatchObject({
      askRecipientName: false,
      showDiscountCodes: true,
    });
  });

  it('names the input field picker after its section', () => {
    render(<Harness value={initialValue()} />);

    expect(
      screen.getByRole('combobox', { name: 'blocks.subscribe.selectFields' })
    ).toBeInTheDocument();
  });
});
