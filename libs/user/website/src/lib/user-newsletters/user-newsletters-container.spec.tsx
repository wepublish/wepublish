import { composeStories, composeStory } from '@storybook/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  UpdateUserNewslettersDocument,
  UserNewslettersDocument,
} from '@wepublish/website/api';
import { mockUserNewsletterGroup } from '@wepublish/storybook/mocks';
import * as stories from './user-newsletters-container.stories';

const { Default, WithoutNewsletters } = composeStories(stories);

const group = mockUserNewsletterGroup();

const updateVariables = {
  input: {
    syncProviderId: group.syncProviderId,
    newsletters: [{ interestId: 'weekly', subscribed: true }],
  },
};

const updateResult = {
  data: {
    updateUserNewsletters: mockUserNewsletterGroup({
      newsletters: group.newsletters.map(newsletter =>
        newsletter.interestId === 'weekly' ?
          { ...newsletter, subscribed: true }
        : newsletter
      ),
    }),
  },
};

const checkbox = (name: RegExp) =>
  screen.getByRole('checkbox', { name }) as HTMLInputElement;

describe('UserNewslettersContainer', () => {
  it('loads the newsletters of the user', async () => {
    render(<Default />);

    await screen.findByRole('checkbox', { name: /Daily Briefing/ });

    expect(checkbox(/Daily Briefing/).checked).toBe(true);
    expect(checkbox(/Weekly Digest/).checked).toBe(false);
  });

  it('saves the changed newsletters and shows the new state', async () => {
    const result = vi.fn().mockReturnValue(updateResult);

    const Story = composeStory(
      {
        parameters: {
          apolloClient: {
            mocks: [
              {
                request: { query: UserNewslettersDocument },
                result: { data: { userNewsletters: [group] } },
              },
              {
                request: {
                  query: UpdateUserNewslettersDocument,
                  variables: updateVariables,
                },
                result,
              },
            ],
          },
        },
      },
      stories.default
    );

    render(<Story />);

    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Weekly Digest/ })
    );
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(result).toHaveBeenCalled());
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(checkbox(/Weekly Digest/).checked).toBe(true);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('renders nothing when there are no newsletters', async () => {
    render(<WithoutNewsletters />);

    await waitFor(() => expect(screen.queryByRole('checkbox')).toBeNull());
    expect(screen.queryByRole('button')).toBeNull();
  });
});
