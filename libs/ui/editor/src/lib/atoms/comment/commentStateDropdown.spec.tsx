import { createTheme, ThemeProvider } from '@mui/material';
import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  CommentRejectionReason,
  CommentState,
  FullCommentFragment,
} from '@wepublish/editor/api';

import { CommentStateDropdown } from './commentStateDropdown';

const theme = createTheme({ cssVariables: true });

const comment = (overrides: Partial<FullCommentFragment> = {}) =>
  ({
    id: 'comment-1',
    state: CommentState.PendingApproval,
    rejectionReason: null,
    revisions: [],
    ...overrides,
  }) as FullCommentFragment;

const renderDropdown = (value = comment()) =>
  render(
    <ThemeProvider theme={theme}>
      <MockedProvider
        mocks={[]}
        addTypename={false}
      >
        <CommentStateDropdown comment={value} />
      </MockedProvider>
    </ThemeProvider>
  );

describe('CommentStateDropdown', () => {
  it('is one control, and it says which state the comment is in', () => {
    renderDropdown();

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: /comments.state.pendingApproval/ })
    ).toBeInTheDocument();
  });

  it('opens the states on a click', () => {
    renderDropdown();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /approve/i })
    ).toBeInTheDocument();
  });

  it('tells assistive technology the button opens a menu', () => {
    renderDropdown();

    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('names the reason a comment was rejected', () => {
    renderDropdown(
      comment({
        state: CommentState.Rejected,
        rejectionReason: CommentRejectionReason.Spam,
      })
    );

    expect(screen.getByText(/spam/i)).toBeInTheDocument();
  });
});
