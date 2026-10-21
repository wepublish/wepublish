import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockBreakBlock,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBreakBlockFragment } from '@wepublish/website/api';
import { t } from 'i18next';
import { BlockRenderer } from '../../blocks';

const renderContextBox = (overrides: Partial<FullBreakBlockFragment> = {}) =>
  renderWithProviders(
    <BlockRenderer
      block={mockBreakBlock({
        blockStyle: 'ContextBox',
        text: 'Worum es geht',
        richText: mockRichTextParagraph('Context for the article'),
        ...overrides,
      })}
      index={0}
      count={1}
      type="Article"
    />
  );

describe('ContextBox block style', () => {
  it('shows the break block text as title and its rich text as content', () => {
    renderContextBox();

    expect(screen.getByRole('complementary')).toHaveTextContent(
      'Worum es geht'
    );
    expect(screen.getByText('Context for the article')).toBeInTheDocument();
  });

  it('shows the default title when the block has no text', () => {
    renderContextBox({ text: null });

    expect(screen.getByText(t('contextBox.defaultTitle'))).toBeInTheDocument();
  });

  it('toggles between read more and read less', async () => {
    const user = userEvent.setup();
    renderContextBox();

    await user.click(
      screen.getByRole('button', { name: t('contextBox.readMore') })
    );

    expect(
      screen.queryByRole('button', { name: t('contextBox.readMore') })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: t('contextBox.readLess') })
    );

    expect(
      screen.getByRole('button', { name: t('contextBox.readMore') })
    ).toBeInTheDocument();
  });
});
