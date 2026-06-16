import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import { useState } from 'react';
import { PaymentAmountSlider } from './payment-amount-slider';

jest.mock('@wepublish/website/builder', () => ({
  useWebsiteBuilder: () => ({
    elements: { TextField: (props: any) => <input {...props} /> },
    meta: { locale: 'de' },
  }),
}));

const theme = createTheme();

const sliderValue = () =>
  (screen.getByRole('slider') as HTMLInputElement).value;

// Reproduces the subscribe block: the amount is set programmatically when the
// user selects a different member plan, so the slider must reflect that change.
// Regression: when the slider first renders without a value, MUI locks it to
// "uncontrolled" forever and ignores later updates (the thumb only moves on
// drag). Coercing the value keeps it controlled from the first render.
function Harness({ startValue }: { startValue: number | undefined }) {
  const [value, setValue] = useState<number | undefined>(startValue);

  return (
    <ThemeProvider theme={theme}>
      <button onClick={() => setValue(800)}>select-other-plan</button>
      <PaymentAmountSlider
        currency={'CHF' as never}
        amountPerMonthMin={500}
        amountPerMonthMax={2000}
        amountPerMonthTarget={700}
        donate={false}
        value={value as number}
        onChange={v => setValue(v)}
        error={undefined}
      />
    </ThemeProvider>
  );
}

describe('PaymentAmountSlider', () => {
  it('reflects a programmatic value change when mounted with a value', () => {
    render(<Harness startValue={0} />);
    expect(sliderValue()).toBe('500'); // 0 clamped to min for display
    fireEvent.click(screen.getByText('select-other-plan'));
    expect(sliderValue()).toBe('800');
  });

  it('reflects a programmatic value change even when mounted without a value', () => {
    render(<Harness startValue={undefined} />);
    fireEvent.click(screen.getByText('select-other-plan'));
    expect(sliderValue()).toBe('800');
  });
});
