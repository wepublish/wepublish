import { act, fireEvent, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';

import { useMobileNavigation } from './mobileNavigation';

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/articles']}>{children}</MemoryRouter>
);

const useNavigationWithRouter = () => ({
  navigation: useMobileNavigation(),
  navigate: useNavigate(),
});

describe('useMobileNavigation', () => {
  it('starts closed and opens on toggle', () => {
    const { result } = renderHook(() => useMobileNavigation(), { wrapper });

    expect(result.current.open).toBe(false);

    act(() => result.current.toggle());

    expect(result.current.open).toBe(true);
  });

  it('closes when the user navigates to another page', () => {
    const { result } = renderHook(useNavigationWithRouter, { wrapper });

    act(() => result.current.navigation.toggle());
    act(() => result.current.navigate('/pages'));

    expect(result.current.navigation.open).toBe(false);
  });

  it('closes on Escape', () => {
    const { result } = renderHook(() => useMobileNavigation(), { wrapper });

    act(() => result.current.toggle());
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(result.current.open).toBe(false);
  });
});
