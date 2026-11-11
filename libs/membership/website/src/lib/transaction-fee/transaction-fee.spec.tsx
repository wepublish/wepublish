import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { BuilderTransactionFeeProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { TransactionFee } from './transaction-fee';

const renderTransactionFee = (
  props: Partial<BuilderTransactionFeeProps> = {}
) => {
  const onChange = vi.fn();

  renderWithProviders(
    <TransactionFee
      onChange={onChange}
      {...props}
    />,
    { builder: { meta: { siteTitle: 'Bajour' } } }
  );

  return { onChange, user: userEvent.setup() };
};

describe('TransactionFee', () => {
  it('is not ticked by default', () => {
    renderTransactionFee();

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('reports that the reader wants to pay the fee', async () => {
    const { user, onChange } = renderTransactionFee();

    await user.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reports that the reader no longer wants to pay the fee', async () => {
    const { user, onChange } = renderTransactionFee({ value: true });

    expect(screen.getByRole('checkbox')).toBeChecked();

    await user.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('asks the reader to support the site by paying the fee', () => {
    renderTransactionFee();

    expect(
      screen.getByRole('checkbox', {
        name: t('subscribe.transactionFee.label', { siteTitle: 'Bajour' }),
      })
    ).toBeInTheDocument();
  });

  it('labels the checkbox with the custom text', () => {
    renderTransactionFee({ text: 'Ich übernehme die Gebühren' });

    expect(
      screen.getByRole('checkbox', { name: 'Ich übernehme die Gebühren' })
    ).toBeInTheDocument();
  });
});
