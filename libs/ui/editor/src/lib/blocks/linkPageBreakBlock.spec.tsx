import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';
import { SetStateAction, useState } from 'react';

import { LinkPageBreakBlock } from './linkPageBreakBlock';
import { LinkPageBreakBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const initialValue: LinkPageBreakBlockValue = {
  text: '',
  richText: undefined as unknown as LinkPageBreakBlockValue['richText'],
  linkURL: 'https://example.com',
  linkText: 'Read more',
  hideButton: false,
};

const renderBlock = (disabled = false) => {
  const latest = { value: initialValue };

  function Harness() {
    const [value, setValue] = useState(initialValue);

    return (
      <LinkPageBreakBlock
        type={EditorBlockType.LinkPageBreak}
        value={value}
        disabled={disabled}
        onChange={(update: SetStateAction<LinkPageBreakBlockValue>) =>
          setValue(current => {
            latest.value =
              typeof update === 'function' ? update(current) : update;

            return latest.value;
          })
        }
      />
    );
  }

  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <Harness />
      </ThemeProvider>
    </MockedProvider>
  );

  return latest;
};

describe('LinkPageBreakBlock', () => {
  it('uses the same title field as the teaser blocks', () => {
    const latest = renderBlock();

    const title = screen.getByPlaceholderText('blocks.title.title');

    expect(title.tagName).toBe('TEXTAREA');

    fireEvent.change(title, { target: { value: 'Support us' } });

    expect(latest.value).toMatchObject({
      text: 'Support us',
      linkURL: 'https://example.com',
      linkText: 'Read more',
    });
  });

  it('offers the link settings as a labelled button', () => {
    renderBlock();

    expect(
      screen.getByRole('button', { name: 'blocks.linkPageBreak.editSettings' })
    ).toHaveClass('MuiButton-text');
  });

  it('disables the image picker and title of a disabled block', () => {
    renderBlock(true);

    expect(
      screen.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeDisabled();
    expect(screen.getByPlaceholderText('blocks.title.title')).toBeDisabled();
  });
});
