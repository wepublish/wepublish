import { composeStories } from '@storybook/react';
import { cleanup, render, screen } from '@testing-library/react';
import de from '@wepublish/website/translations/de.json';
import * as stories from './personal-data-form.stories';

const { Default } = composeStories(stories);

describe('PersonalDataForm password hint', () => {
  afterEach(cleanup);

  it('explains the password field in words, not as a translation key', () => {
    render(<Default />);

    expect(screen.getByText(de.user.passwordWarning)).toBeTruthy();
    expect(screen.queryByText(/user\.password/)).toBeNull();
  });
});
