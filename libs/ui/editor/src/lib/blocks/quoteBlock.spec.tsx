import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';
import { SetStateAction, useState } from 'react';

import { QuoteBlock } from './quoteBlock';
import { QuoteBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const initialValue: QuoteBlockValue = {
  quote: '',
  author: 'Ada Lovelace',
  image: null,
};

const renderBlock = (disabled = false) => {
  const latest = { value: initialValue };

  function Harness() {
    const [value, setValue] = useState(initialValue);

    return (
      <QuoteBlock
        type={EditorBlockType.Quote}
        value={value}
        disabled={disabled}
        onChange={(update: SetStateAction<QuoteBlockValue>) =>
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

describe('QuoteBlock', () => {
  it('keeps the author when the quote is typed', () => {
    const latest = renderBlock();

    fireEvent.change(screen.getByPlaceholderText('blocks.quote.quote'), {
      target: { value: 'The Analytical Engine weaves algebraic patterns' },
    });

    expect(latest.value).toMatchObject({
      quote: 'The Analytical Engine weaves algebraic patterns',
      author: 'Ada Lovelace',
    });
  });

  it('disables the image picker of a disabled block', () => {
    renderBlock(true);

    expect(
      screen.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeDisabled();
  });
});
