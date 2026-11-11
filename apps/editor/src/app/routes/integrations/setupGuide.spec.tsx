import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { SetupGuide } from './setupGuide';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

const steps = [
  { text: 'Create a key', href: 'https://dashboard.stripe.com/apikeys' },
  {
    text: 'Register the webhook',
    webhookUrl: 'https://api.example.ch/payment-webhooks/stripe',
  },
];

const renderGuide = (expanded: boolean) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SetupGuide
        provider="Stripe"
        steps={steps}
        defaultExpanded={expanded}
      />
    </ThemeProvider>
  );

describe('SetupGuide', () => {
  it('lists the steps in order', () => {
    renderGuide(true);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Create a key');
    expect(items[1]).toHaveTextContent('Register the webhook');
  });

  it('opens the provider’s page in a new tab', () => {
    renderGuide(true);

    const link = screen.getByRole('link', { name: /dashboard.stripe.com/ });

    expect(link).toHaveAttribute(
      'href',
      'https://dashboard.stripe.com/apikeys'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('copies the webhook URL', () => {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    renderGuide(true);

    expect(
      screen.getByDisplayValue('https://api.example.ch/payment-webhooks/stripe')
    ).toHaveAttribute('readonly');

    fireEvent.click(
      screen.getByRole('button', { name: 'integrations.guide.copyUrl' })
    );

    expect(writeText).toHaveBeenCalledWith(
      'https://api.example.ch/payment-webhooks/stripe'
    );
  });

  it('stays collapsed once the provider is set up', () => {
    renderGuide(false);

    expect(
      screen.getByRole('button', { name: /integrations.guide.title/ })
    ).toHaveAttribute('aria-expanded', 'false');
  });
});
