import { fireEvent, screen } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockGoodie,
  mockMemberPlan,
  mockPeriodicityPrice,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { PaymentPeriodicity } from '@wepublish/website/api';

import { zwoelfTenant } from '../zwoelf-tenant';
import { ZwoelfPeriodicityPicker } from './zwoelf-periodicity-picker';

const periodicities = [PaymentPeriodicity.Yearly, PaymentPeriodicity.Biennial];

const booklet = mockGoodie({
  name: 'Booklet NLA-Legenden',
  paymentPeriodicities: [PaymentPeriodicity.Biennial],
});

const plan = mockMemberPlan({
  goodies: [booklet],
  periodicityPricing: [
    mockPeriodicityPrice({ periodicity: PaymentPeriodicity.Yearly }),
    mockPeriodicityPrice({ periodicity: PaymentPeriodicity.Biennial }),
  ],
});

describe('ZwoelfPeriodicityPicker', () => {
  beforeAll(() => applyTenantTranslations(zwoelfTenant));
  afterAll(() => resetTranslations());

  it('offers the durations as cards and tells which goodie a duration includes', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ZwoelfPeriodicityPicker
        periodicities={periodicities}
        value={PaymentPeriodicity.Yearly}
        onChange={onChange}
        memberPlan={plan}
        variant="toggle"
      />,
      { tenant: zwoelfTenant }
    );

    expect(
      screen.getByRole('heading', { name: 'Laufzeit wählen' })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1 Jahr' })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: '2 Jahre Inkl. Booklet NLA-Legenden' })
    ).not.toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /2 Jahre/ }));

    expect(onChange).toHaveBeenCalledWith(PaymentPeriodicity.Biennial);
  });

  it('prefers the label of the pricing row over the goodies', () => {
    renderWithProviders(
      <ZwoelfPeriodicityPicker
        periodicities={periodicities}
        value={PaymentPeriodicity.Yearly}
        onChange={vi.fn()}
        memberPlan={mockMemberPlan({
          goodies: [booklet],
          periodicityPricing: [
            mockPeriodicityPrice({
              periodicity: PaymentPeriodicity.Biennial,
              label: '2 Monate geschenkt',
            }),
          ],
        })}
        variant="toggle"
      />,
      { tenant: zwoelfTenant }
    );

    expect(
      screen.getByRole('radio', { name: '2 Jahre 2 Monate geschenkt' })
    ).toBeInTheDocument();
  });

  it('renders nothing when there is only one duration', () => {
    const { container } = renderWithProviders(
      <ZwoelfPeriodicityPicker
        periodicities={[PaymentPeriodicity.Yearly]}
        value={PaymentPeriodicity.Yearly}
        onChange={vi.fn()}
        memberPlan={plan}
        variant="toggle"
      />,
      { tenant: zwoelfTenant }
    );

    expect(container).toBeEmptyDOMElement();
  });
});
