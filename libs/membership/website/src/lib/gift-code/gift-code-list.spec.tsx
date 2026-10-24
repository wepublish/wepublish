import { composeStories } from '@storybook/react';
import { act, render, waitFor } from '@testing-library/react';
import { userEvent, within } from 'storybook/test';
import * as stories from './gift-code-list.stories';

const storiesCmp = composeStories(stories);

describe('GiftCodeList', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });

  it('copies the issued code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const { Issued } = storiesCmp;
    const { container } = render(<Issued />);
    const canvas = within(container);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Code kopieren' })
    );

    expect(writeText).toHaveBeenCalledWith('ABCD-EFGH-JKMN');
    await waitFor(() => expect(canvas.getByText('Kopiert')).toBeTruthy());

    vi.unstubAllGlobals();
  });

  it('keeps the copy button when the clipboard is unavailable', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const { Issued } = storiesCmp;
    const { container } = render(<Issued />);
    const canvas = within(container);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Code kopieren' })
    );

    expect(writeText).toHaveBeenCalled();
    expect(canvas.getByRole('button', { name: 'Code kopieren' })).toBeTruthy();
    expect(canvas.getByText('ABCD-EFGH-JKMN')).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it('does not claim the code was copied without a clipboard', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });

    const { Issued } = storiesCmp;
    const { container } = render(<Issued />);
    const canvas = within(container);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Code kopieren' })
    );

    expect(canvas.queryByText('Kopiert')).toBeNull();
    expect(canvas.getByRole('button', { name: 'Code kopieren' })).toBeTruthy();

    vi.unstubAllGlobals();
  });
});
