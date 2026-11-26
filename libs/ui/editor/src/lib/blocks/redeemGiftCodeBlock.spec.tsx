import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { SubscribeBlockField } from '@wepublish/editor/api';
import { SetStateAction, useState } from 'react';

import { RedeemGiftCodeBlock } from './redeemGiftCodeBlock';
import { RedeemGiftCodeBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderedValue = vi.fn<(value: RedeemGiftCodeBlockValue) => void>();
const latest = () => renderedValue.mock.lastCall![0];

const Harness = ({ value: start }: { value: RedeemGiftCodeBlockValue }) => {
  const [value, setValue] = useState(start);
  renderedValue(value);

  return (
    <ThemeProvider theme={theme}>
      <RedeemGiftCodeBlock
        value={value}
        onChange={(next: SetStateAction<RedeemGiftCodeBlockValue>) =>
          setValue(next)
        }
      />
    </ThemeProvider>
  );
};

describe('RedeemGiftCodeBlock', () => {
  it('only configures the input fields', () => {
    render(<Harness value={{ fields: [SubscribeBlockField.FirstName] }} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'blocks.subscribe.selectFields' })
    ).toBeInTheDocument();
    expect(latest()).toEqual({ fields: [SubscribeBlockField.FirstName] });
  });
});
