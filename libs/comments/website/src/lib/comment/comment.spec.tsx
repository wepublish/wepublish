import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { CommentAuthorType } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { ReactNode } from 'react';
import { Comment } from './comment';

const RichText = () => <div />;

const Paragraph = ({ children }: { children?: ReactNode }) => <p>{children}</p>;

describe('Comment', () => {
  it('shows the creation date even when a non-link flair is present', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <WebsiteBuilderProvider
          blocks={{ RichText: RichText as unknown as never }}
          elements={{ Paragraph: Paragraph as unknown as never }}
          date={{ format: () => '1 Jan 2026' }}
        >
          <Comment
            id="comment-1"
            createdAt="2026-01-01T00:00:00.000Z"
            modifiedAt="2026-01-01T00:00:00.000Z"
            authorType={CommentAuthorType.Team}
            source="Moderation"
            guestUsername="Guest"
            text={[]}
            tags={[]}
            showContent={false}
          />
        </WebsiteBuilderProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('Moderation')).toBeTruthy();
    expect(screen.getByText('1 Jan 2026')).toBeTruthy();
  });
});
