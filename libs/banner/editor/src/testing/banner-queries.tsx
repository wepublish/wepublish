import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { AuthContext } from '@wepublish/ui/editor';
import type { ReactElement } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { imageEditor } from './banner-mocks';

function Location() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

export function BannerRoutes({
  path,
  element,
}: {
  path: string;
  element: ReactElement;
}) {
  return (
    <AuthContext.Provider value={imageEditor}>
      <Routes>
        <Route
          path={path}
          element={element}
        />
        <Route
          path="*"
          element={<Location />}
        />
      </Routes>
    </AuthContext.Provider>
  );
}

export const controlOf = (label: RegExp) => {
  const control = screen
    .getByText(label, { selector: 'label' })
    .closest<HTMLElement>('.MuiFormControl-root');

  if (!control) {
    throw new Error(`No form control for ${label}`);
  }

  return control;
};

export const inputOf = (label: RegExp) => {
  const input = controlOf(label).querySelector<HTMLInputElement>(
    'input:not([type="hidden"]), textarea:not([aria-hidden="true"])'
  );

  if (!input) {
    throw new Error(`No input for ${label}`);
  }

  return input;
};

export const checkboxOf = (label: RegExp) =>
  screen.getByRole('checkbox', { name: label });

export const actionsSection = () =>
  screen.getByRole('region', { name: 'banner.form.actions' });

export const pickPage = async (user: UserEvent, title: string) => {
  if (!screen.queryByRole('listbox')) {
    await user.click(
      screen.getByPlaceholderText('navigation.panels.selectPage')
    );
  }

  await user.click(await screen.findByRole('option', { name: title }));
};

export const saveButton = () => screen.getByRole('button', { name: 'save' });

export const saveAndCloseButton = () =>
  screen.getByRole('button', { name: 'saveAndClose' });

export const drawerClosed = () =>
  waitFor(() =>
    expect(document.querySelector('.MuiDrawer-root')).not.toBeInTheDocument()
  );

export const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

export const title = /^banner\.form\.title\*?$/;
export const text = /^banner\.form\.text\*?$/;
export const delay = /^banner\.form\.delay\*?$/;
export const hideForMinutes = /^banner\.form\.hideForMinutes\*?$/;
export const cta = /^banner\.form\.cta$/;
export const html = /^banner\.form\.html$/;
export const embedUrl = /^banner\.form\.embedUrl$/;
