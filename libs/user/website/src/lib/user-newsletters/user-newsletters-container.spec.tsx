import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  mockOperation,
  mockUserNewsletterGroup,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  UpdateUserNewslettersDocument,
  UserNewslettersDocument,
} from '@wepublish/website/api';
import { UserNewslettersContainer } from './user-newsletters-container';

const group = mockUserNewsletterGroup();

const userNewslettersQuery = (userNewsletters = [group]) =>
  mockOperation(UserNewslettersDocument, {
    data: { __typename: 'Query', userNewsletters },
  });

const checkbox = (name: RegExp) =>
  screen.getByRole('checkbox', { name }) as HTMLInputElement;

describe('UserNewslettersContainer', () => {
  it('loads the newsletters of the user', async () => {
    renderWithProviders(<UserNewslettersContainer />, {
      mocks: [userNewslettersQuery()],
    });

    await screen.findByRole('checkbox', { name: /Daily Briefing/ });

    expect(checkbox(/Daily Briefing/).checked).toBe(true);
    expect(checkbox(/Weekly Digest/).checked).toBe(false);
  });

  it('saves the changed newsletters and shows the new state', async () => {
    renderWithProviders(<UserNewslettersContainer />, {
      mocks: [
        userNewslettersQuery(),
        mockOperation(UpdateUserNewslettersDocument, {
          variables: {
            input: {
              syncProviderId: group.syncProviderId,
              newsletters: [{ interestId: 'weekly', subscribed: true }],
            },
          },
          data: {
            __typename: 'Mutation',
            updateUserNewsletters: mockUserNewsletterGroup({
              newsletters: group.newsletters.map(newsletter =>
                newsletter.interestId === 'weekly' ?
                  { ...newsletter, subscribed: true }
                : newsletter
              ),
            }),
          },
        }),
      ],
    });

    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Weekly Digest/ })
    );
    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(checkbox(/Weekly Digest/).checked).toBe(true);
    await waitFor(() =>
      expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(
        true
      )
    );
  });

  it('renders nothing when there are no newsletters', async () => {
    renderWithProviders(<UserNewslettersContainer />, {
      mocks: [userNewslettersQuery([])],
    });

    await waitFor(() => expect(screen.queryByRole('checkbox')).toBeNull());
    expect(screen.queryByRole('button')).toBeNull();
  });
});
