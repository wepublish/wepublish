import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { BuilderPeriodicityPickerProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { PeriodicityPicker } from './periodicity-picker';

const periodicities = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Yearly,
];

const renderPeriodicityPicker = (
  props: Partial<BuilderPeriodicityPickerProps> = {}
) => {
  const onChange = vi.fn();

  renderWithProviders(
    <PeriodicityPicker
      periodicities={periodicities}
      onChange={onChange}
      {...props}
    />
  );

  return { onChange, user: userEvent.setup() };
};

const select = () => screen.getByLabelText(t('subscribe.periodicity'));

describe('PeriodicityPicker', () => {
  it('offers every periodicity by its renewal period', () => {
    renderPeriodicityPicker({ value: PaymentPeriodicity.Monthly });

    expect(
      screen.getAllByRole('option').map(option => option.textContent)
    ).toEqual([
      t('subscription.renewalPeriod.monthly'),
      t('subscription.renewalPeriod.quarterly'),
      t('subscription.renewalPeriod.yearly'),
    ]);
  });

  it('picks the first periodicity when nothing is chosen yet', () => {
    const { onChange } = renderPeriodicityPicker();

    expect(onChange).toHaveBeenCalledWith(PaymentPeriodicity.Monthly);
  });

  it('keeps the chosen periodicity', () => {
    const { onChange } = renderPeriodicityPicker({
      value: PaymentPeriodicity.Quarterly,
    });

    expect(select()).toHaveValue(PaymentPeriodicity.Quarterly);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports the picked periodicity', async () => {
    const { user, onChange } = renderPeriodicityPicker({
      value: PaymentPeriodicity.Monthly,
    });

    await user.selectOptions(select(), PaymentPeriodicity.Yearly);

    expect(onChange).toHaveBeenCalledWith(PaymentPeriodicity.Yearly);
  });

  it('shows no picker for a single periodicity but still picks it', () => {
    const { onChange } = renderPeriodicityPicker({
      periodicities: [PaymentPeriodicity.Yearly],
    });

    expect(
      screen.queryByLabelText(t('subscribe.periodicity'))
    ).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(PaymentPeriodicity.Yearly);
  });

  describe('as toggle', () => {
    const toggle = (key: string) =>
      screen.getByRole('button', { name: t(key) });

    it('marks the chosen periodicity as pressed', () => {
      renderPeriodicityPicker({
        variant: 'toggle',
        value: PaymentPeriodicity.Quarterly,
      });

      expect(toggle('subscription.renewalPeriod.quarterly')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(toggle('subscription.renewalPeriod.monthly')).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('reports the picked periodicity', async () => {
      const { user, onChange } = renderPeriodicityPicker({
        variant: 'toggle',
        value: PaymentPeriodicity.Monthly,
      });

      await user.click(toggle('subscription.renewalPeriod.yearly'));

      expect(onChange).toHaveBeenCalledWith(PaymentPeriodicity.Yearly);
    });

    it('keeps a periodicity when the reader clicks the pressed one again', async () => {
      const { user, onChange } = renderPeriodicityPicker({
        variant: 'toggle',
        value: PaymentPeriodicity.Monthly,
      });

      await user.click(toggle('subscription.renewalPeriod.monthly'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
