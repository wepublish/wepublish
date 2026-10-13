import { composeStories } from '@storybook/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as stories from './content-gate.stories';

const { Soft, Hard, ForNonSubscribers, WithCallToAction } =
  composeStories(stories);

const texts = {
  cta: 'Register',
  login: 'Login',
  continueReading: 'Continue reading',
};

describe('ContentGate', () => {
  Object.entries(composeStories(stories)).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('lets readers dismiss the soft gate', async () => {
    render(<Soft texts={texts} />);

    fireEvent.click(screen.getByText('Continue reading'));

    await waitFor(() =>
      expect(screen.queryByText('Continue reading')).toBeNull()
    );
  });

  it('cannot be dismissed as a hard gate', () => {
    render(<Hard texts={texts} />);

    expect(screen.queryByText('Continue reading')).toBeNull();
    expect(screen.getByText('Register')).toBeTruthy();
  });

  it('sends anonymous readers to the registration by default', () => {
    render(<Hard texts={texts} />);

    expect(
      screen.getByText('Register').closest('a')?.getAttribute('href')
    ).toBe('/signup');
  });

  it('sends non-subscribers to the subscription page by default', () => {
    render(<ForNonSubscribers texts={texts} />);

    expect(
      screen.getByText('Register').closest('a')?.getAttribute('href')
    ).toBe('/mitmachen');
  });

  it('uses the call to action of the gate', () => {
    render(<WithCallToAction />);

    expect(
      screen
        .getByText('Jetzt gratis registrieren')
        .closest('a')
        ?.getAttribute('href')
    ).toBe('/registrieren');
  });

  it('offers the login to anonymous readers', () => {
    render(<Hard texts={texts} />);

    expect(screen.getByText('Login').closest('a')?.getAttribute('href')).toBe(
      '/login'
    );
  });
});
