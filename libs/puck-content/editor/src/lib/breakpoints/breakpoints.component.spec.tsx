import { createTheme, ThemeProvider } from '@mui/material';
import { Puck } from '@puckeditor/core';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import i18next from 'i18next';
import { useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { WebsiteThemeContext } from '../website-theme';
import { BreakpointsFieldRender } from './breakpoints.component';
import { BreakpointsField, BreakpointsValue } from './breakpoints.field';

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initImmediate: false,
  interpolation: { escapeValue: false },
});

const theme = createTheme({ cssVariables: true });

const field: BreakpointsField = {
  type: 'breakpoints',
  label: 'Layout',
  objectFields: {
    columns: { type: 'number', label: 'Columns' },
  },
};

type HarnessProps = {
  initialValue: BreakpointsValue;
  readOnly?: boolean;
  onChange: (value: BreakpointsValue) => void;
};

const BreakpointsHarness = ({
  initialValue,
  readOnly,
  onChange,
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <WebsiteThemeContext.Provider value={theme}>
          <Puck
            config={{ components: {} }}
            data={{}}
          >
            <BreakpointsFieldRender
              id="layout"
              name="layout"
              field={field}
              value={value}
              readOnly={readOnly}
              onChange={next => {
                setValue(next);
                onChange(next);
              }}
            />
          </Puck>
        </WebsiteThemeContext.Provider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

const renderField = (props: Omit<HarnessProps, 'onChange'>) => {
  const onChange = vi.fn();
  const view = render(
    <BreakpointsHarness
      {...props}
      onChange={onChange}
    />
  );

  return { ...view, onChange };
};

describe('BreakpointsFieldRender', () => {
  it('marks the selected breakpoint as pressed', () => {
    renderField({ initialValue: { xs: { columns: 1 }, md: { columns: 2 } } });

    const md = screen.getByRole('button', { name: 'md' });
    fireEvent.click(md);

    expect(md).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'xs' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('removes a breakpoint with its own button next to the breakpoint', () => {
    const { container, onChange } = renderField({
      initialValue: { xs: { columns: 1 }, md: { columns: 2 } },
    });

    expect(container.querySelector('button button')).toBeNull();
    expect(container.querySelector('button [role="button"]')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Remove xs breakpoint' })
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove md breakpoint' })
    );

    expect(onChange).toHaveBeenLastCalledWith({ xs: { columns: 1 } });
    expect(
      screen.queryByRole('button', { name: 'md' })
    ).not.toBeInTheDocument();
  });

  it('moves focus to the base breakpoint when the selected one is removed', () => {
    renderField({ initialValue: { xs: { columns: 1 }, md: { columns: 2 } } });

    fireEvent.click(screen.getByRole('button', { name: 'md' }));

    const remove = screen.getByRole('button', { name: 'Remove md breakpoint' });

    remove.focus();
    fireEvent.click(remove);

    expect(
      screen.queryByRole('button', { name: 'Remove md breakpoint' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'xs' })).toHaveFocus();
  });

  it('keeps focus on the selected breakpoint when another one is removed', () => {
    renderField({
      initialValue: { xs: { columns: 1 }, md: { columns: 2 }, lg: {} },
    });

    fireEvent.click(screen.getByRole('button', { name: 'md' }));

    const remove = screen.getByRole('button', { name: 'Remove lg breakpoint' });

    remove.focus();
    fireEvent.click(remove);

    expect(screen.getByRole('button', { name: 'md' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'md' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('gives the remove button a 24px target that does not overlap its breakpoint', () => {
    renderField({ initialValue: { xs: { columns: 1 }, md: { columns: 2 } } });

    const style = getComputedStyle(
      screen.getByRole('button', { name: 'Remove md breakpoint' })
    );

    expect(style.width).toBe('24px');
    expect(style.height).toBe('24px');
    expect(parseFloat(style.marginLeft)).toBeGreaterThanOrEqual(0);
  });

  it('adds a breakpoint from a menu seeded with the inherited value', () => {
    const { onChange } = renderField({
      initialValue: { xs: { columns: 1 }, md: { columns: 2 } },
    });

    const add = screen.getByRole('button', { name: 'Add breakpoint' });
    expect(add).toHaveAttribute('aria-haspopup', 'menu');

    fireEvent.click(add);

    const menu = screen.getByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map(item => item.textContent)
    ).toEqual(['sm600px', 'lg1200px', 'xl1536px']);

    fireEvent.click(within(menu).getByRole('menuitem', { name: /lg/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      xs: { columns: 1 },
      md: { columns: 2 },
      lg: { columns: 2 },
    });
    expect(screen.getByRole('button', { name: 'lg' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('closes the add menu with Escape and moves through it with the arrow keys', async () => {
    renderField({ initialValue: { xs: { columns: 1 } } });

    const add = screen.getByRole('button', { name: 'Add breakpoint' });
    fireEvent.click(add);

    const menu = screen.getByRole('menu');
    expect(add).toHaveAttribute('aria-expanded', 'true');
    expect(add).toHaveAttribute('aria-controls', menu.id);

    const [first, second] = within(menu).getAllByRole('menuitem');
    await waitFor(() => expect(first).toHaveFocus());

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(second).toHaveFocus();

    fireEvent.keyDown(second, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
    expect(add).not.toHaveAttribute('aria-expanded', 'true');
  });

  it('offers no editing actions when read only', () => {
    renderField({
      initialValue: { xs: { columns: 1 }, md: { columns: 2 } },
      readOnly: true,
    });

    expect(
      screen.queryByRole('button', { name: 'Remove md breakpoint' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add breakpoint' })
    ).toBeDisabled();
  });
});
