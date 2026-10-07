import { fireEvent, render, screen } from '@testing-library/react';
import { SubscriptionDeactivationReason } from '@wepublish/editor/api';

import { UserSubscriptionDeactivatePanel } from './userSubscriptionDeactivatePanel';

// Translate to the raw key so assertions stay deterministic and locale-agnostic.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPanel = () => {
  const onDeactivate = vi.fn();

  render(
    <UserSubscriptionDeactivatePanel
      displayName="Anna Muster"
      userEmail="anna@example.com"
      onDeactivate={onDeactivate}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(
    screen.getByText('userSubscriptionEdit.deactivation.reasonNone')
  );

  return { onDeactivate };
};

const deactivate = () =>
  fireEvent.click(
    screen.getByText('userSubscriptionEdit.deactivation.action.activated')
  );

describe('UserSubscriptionDeactivatePanel', () => {
  it('lets the deactivation mail go out by default', () => {
    const { onDeactivate } = renderPanel();

    deactivate();

    expect(onDeactivate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: SubscriptionDeactivationReason.None,
        skipMail: false,
      })
    );
  });

  it('suppresses the deactivation mail when the editor asks for it', () => {
    const { onDeactivate } = renderPanel();

    fireEvent.click(
      screen.getByLabelText('userSubscriptionEdit.deactivation.doNotSendMail')
    );
    deactivate();

    expect(onDeactivate).toHaveBeenCalledWith(
      expect.objectContaining({ skipMail: true })
    );
  });
});
