import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';

import { onlyLatestOpen, useSidebarMenu } from './sidebarMenu';

describe('onlyLatestOpen', () => {
  it('closes the open menu when another one is opened', () => {
    expect(onlyLatestOpen(['articles'], ['articles', 'pages'])).toEqual([
      'pages',
    ]);
  });

  it('closes the menu the user collapsed', () => {
    expect(onlyLatestOpen(['articles'], [])).toEqual([]);
  });

  it('opens the first menu', () => {
    expect(onlyLatestOpen([], ['comments'])).toEqual(['comments']);
  });
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/articles']}>{children}</MemoryRouter>
);

const useMenuWithRouter = () => ({
  menu: useSidebarMenu(),
  navigate: useNavigate(),
});

describe('useSidebarMenu', () => {
  it('follows the current route until the reader says otherwise', () => {
    const { result } = renderHook(() => useSidebarMenu(), { wrapper });

    expect(result.current.followsRoute).toBe(true);
    expect(result.current.openMenus).toEqual([]);
  });

  it('opens the menu the reader picked, and stops following the route', () => {
    const { result } = renderHook(() => useSidebarMenu(), { wrapper });

    act(() => result.current.toggleMenu('peering', false));

    expect(result.current.openMenus).toEqual(['peering']);
    expect(result.current.followsRoute).toBe(false);
  });

  it('closes the open menu when another one is picked', () => {
    const { result } = renderHook(() => useSidebarMenu(), { wrapper });

    act(() => result.current.toggleMenu('peering', false));
    act(() => result.current.toggleMenu('settings', false));

    expect(result.current.openMenus).toEqual(['settings']);
  });

  it('closes the menu the reader collapsed', () => {
    const { result } = renderHook(() => useSidebarMenu(), { wrapper });

    act(() => result.current.toggleMenu('peering', false));
    act(() => result.current.toggleMenu('peering', true));

    expect(result.current.openMenus).toEqual([]);
  });

  it('hands control back to the route on the next navigation', () => {
    const { result } = renderHook(useMenuWithRouter, { wrapper });

    act(() => result.current.menu.toggleMenu('peering', false));
    act(() => result.current.navigate('/goodies'));

    expect(result.current.menu.openMenus).toEqual([]);
    expect(result.current.menu.followsRoute).toBe(true);
  });

  it('leaves the reader alone while they stay on the page', () => {
    const { result } = renderHook(useMenuWithRouter, { wrapper });

    act(() => result.current.menu.toggleMenu('peering', false));
    act(() => result.current.navigate('/articles'));

    expect(result.current.menu.openMenus).toEqual(['peering']);
    expect(result.current.menu.followsRoute).toBe(false);
  });
});
