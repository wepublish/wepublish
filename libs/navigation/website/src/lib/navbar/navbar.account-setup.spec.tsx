import { composeStory } from '@storybook/react';
import { cleanup, render, screen } from '@testing-library/react';
import * as config from '@wepublish/storybook';
import { WithUserDecorator } from '@wepublish/storybook';
import { mockUser } from '@wepublish/storybook/mocks';
import de from '@wepublish/website/translations/de.json';
import { Navbar } from './navbar';
import { Default } from './navbar.stories';

const renderNavbar = (accountSetupPending: boolean) => {
  const Story = composeStory(
    {
      render: () => (
        <Navbar
          {...(Default.args as never)}
          isMenuOpen
          hasRunningSubscription
          hasUnpaidInvoices
          accountSetupPending={accountSetupPending}
        />
      ),
      decorators: [WithUserDecorator(mockUser())],
    },
    { title: 'Navbar' },
    config
  );

  render(<Story />);
};

const linksNamed = (name: string) =>
  screen
    .queryAllByRole('link')
    .filter(link => link.textContent?.includes(name));

describe('Navbar while the account is being set up', () => {
  afterEach(cleanup);

  it('hides the account, which cannot be used before the setup', () => {
    renderNavbar(true);

    expect(linksNamed(de.navbar.myAccount)).toHaveLength(0);
  });

  it('does not mention unpaid invoices before the setup', () => {
    renderNavbar(true);

    expect(linksNamed(de.navbar.unpaid)).toHaveLength(0);
  });

  it('keeps logging out possible', () => {
    renderNavbar(true);

    expect(screen.getByRole('button', { name: de.navbar.logout })).toBeTruthy();
  });

  it('keeps the usual account buttons otherwise', () => {
    renderNavbar(false);

    expect(linksNamed(de.navbar.myAccount).length).toBeGreaterThan(0);
    expect(linksNamed(de.navbar.unpaid).length).toBeGreaterThan(0);
  });
});
