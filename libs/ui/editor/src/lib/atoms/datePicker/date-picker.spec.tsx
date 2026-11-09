import { createTheme, Dialog, ThemeProvider } from '@mui/material';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { DatePicker, DateRangePicker } from './date-picker';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('DatePicker in a dialog', () => {
  const renderInDialog = (onClose = vi.fn()) => {
    render(
      <ThemeProvider theme={theme}>
        <Dialog
          open
          onClose={onClose}
        >
          <DatePicker
            label="Publish date"
            value={null}
            onChange={vi.fn()}
          />
        </Dialog>
      </ThemeProvider>
    );

    return onClose;
  };

  it('closes only the calendar on Escape, not the dialog around it', () => {
    const onClose = renderInDialog();
    const field = screen.getByRole('textbox', { name: 'Publish date' });

    act(() => field.focus());
    expect(document.querySelector('.react-datepicker')).not.toBeNull();

    fireEvent.keyDown(field, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('lets Escape close the dialog once the calendar is shut', () => {
    const onClose = renderInDialog();
    const field = screen.getByRole('textbox', { name: 'Publish date' });

    fireEvent.keyDown(field, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('tells assistive technology that the field opens a calendar', () => {
    renderInDialog();
    const field = screen.getByRole('textbox', { name: 'Publish date' });

    expect(field).toHaveAttribute('aria-haspopup', 'dialog');
    expect(field).not.toHaveAttribute('aria-expanded');
  });
});

describe('DatePicker clear button', () => {
  it('is named in the user language', () => {
    render(
      <ThemeProvider theme={theme}>
        <DatePicker
          label="Ends at"
          value={new Date('2026-03-04T09:30:00')}
          onChange={vi.fn()}
          clearable
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('button', { name: 'dateTimePicker.clear' })
    ).toBeInTheDocument();
  });
});

describe('DateRangePicker in a dialog', () => {
  it('closes only the calendar on Escape', () => {
    const onClose = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <Dialog
          open
          onClose={onClose}
        >
          <DateRangePicker
            label="Period"
            from={null}
            to={null}
            onChange={vi.fn()}
          />
        </Dialog>
      </ThemeProvider>
    );

    const field = screen.getByRole('textbox', { name: 'Period' });
    act(() => field.focus());
    fireEvent.keyDown(field, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });
});
