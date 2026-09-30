import type { Mock } from 'vitest';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import {
  ConfirmNewsletterSubscriptionDocument,
  MyNewsletterListsDocument,
  NewsletterListUserStatus,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { useRouter } from 'next/router';
import { ComponentProps, PropsWithChildren } from 'react';
import { ProfileNewsletter } from './profile-newsletter';

vi.mock('next/router', () => ({ useRouter: vi.fn() }));

vi.mock('@wepublish/membership/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/membership/website')>()),
  NewsletterListContainer: () => <div>newsletter lists</div>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'de' },
  }),
}));

const list = {
  __typename: 'MyNewsletterList',
  id: 'morning',
  name: 'Morgenbriefing',
  slug: 'morgenbriefing',
  description: null,
  lockedText: null,
  lockedLinkUrl: null,
  status: NewsletterListUserStatus.Subscribed,
};

const listsMock = (lists: (typeof list)[]): MockedResponse => ({
  request: { query: MyNewsletterListsDocument },
  result: { data: { myNewsletterLists: lists } },
});

const confirmMock: MockedResponse = {
  request: {
    query: ConfirmNewsletterSubscriptionDocument,
    variables: { token: 'confirm-token' },
  },
  result: { data: { confirmNewsletterSubscription: [list] } },
};

const confirmErrorMock: MockedResponse = {
  request: {
    query: ConfirmNewsletterSubscriptionDocument,
    variables: { token: 'confirm-token' },
  },
  result: {
    errors: [
      {
        message: 'The newsletter confirmation link is invalid or has expired.',
      } as never,
    ],
  },
};

const H4 = ({ children }: PropsWithChildren) => <h4>{children}</h4>;
const Paragraph = ({ children }: PropsWithChildren) => <p>{children}</p>;
const Alert = ({
  children,
  severity,
}: PropsWithChildren<{ severity: string }>) => (
  <div
    role="alert"
    data-severity={severity}
  >
    {children}
  </div>
);

const ContentWrapper = ({ children }: PropsWithChildren) => (
  <article>{children}</article>
);

type SessionContextValue = ComponentProps<
  typeof SessionTokenContext.Provider
>['value'];

const sessionUser = { id: 'user-1', email: 'anna@example.com' };

const renderSection = (mocks: MockedResponse[]) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MockedProvider mocks={mocks}>
        <SessionTokenContext.Provider
          value={[sessionUser, true, vi.fn()] as unknown as SessionContextValue}
        >
          <WebsiteBuilderProvider
            ContentWrapper={ContentWrapper}
            elements={{ H4, Alert, Paragraph } as never}
          >
            <ProfileNewsletter />
          </WebsiteBuilderProvider>
        </SessionTokenContext.Provider>
      </MockedProvider>
    </ThemeProvider>
  );

const mockRouter = (query: Record<string, string>) => {
  const router = { query, replace: vi.fn().mockResolvedValue(true) };
  (useRouter as Mock).mockReturnValue(router);

  return router;
};

describe('ProfileNewsletter', () => {
  it('shows the newsletter lists when there are any', async () => {
    mockRouter({});
    renderSection([listsMock([list])]);

    expect(await screen.findByText('newsletter.title')).toBeTruthy();
    expect(screen.getByText('newsletter lists')).toBeTruthy();
  });

  it('explains what the newsletters are and where they are sent', async () => {
    mockRouter({});
    renderSection([listsMock([list])]);

    expect(await screen.findByText(/newsletter.intro/)).toBeTruthy();
    expect(
      screen.getByText(/newsletter.recipient {"email":"anna@example.com"}/)
    ).toBeTruthy();
  });

  it('shows nothing without newsletter lists', async () => {
    mockRouter({});
    const { container } = renderSection([listsMock([])]);

    await waitFor(() => expect(container.innerHTML).toBe(''));
  });

  it('confirms the double opt-in from the mail link and cleans up the url', async () => {
    const router = mockRouter({
      confirmNewsletter: 'confirm-token',
      jwt: 'login-jwt',
      utm_source: 'mail',
    });
    renderSection([listsMock([list]), confirmMock]);

    expect(await screen.findByText('newsletter.confirmed')).toBeTruthy();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        { pathname: '/profile', query: { utm_source: 'mail' } },
        undefined,
        { shallow: true }
      )
    );
  });

  it('shows why a confirmation link did not work', async () => {
    const router = mockRouter({ confirmNewsletter: 'confirm-token' });
    renderSection([listsMock([list]), confirmErrorMock]);

    expect(
      await screen.findByText(
        'The newsletter confirmation link is invalid or has expired.'
      )
    ).toBeTruthy();
    await waitFor(() => expect(router.replace).toHaveBeenCalled());
  });
});
