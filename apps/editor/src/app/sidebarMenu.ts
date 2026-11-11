import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export function onlyLatestOpen(previous: string[], next: string[]) {
  const opened = next.filter(key => !previous.includes(key));

  return opened.length ? opened.slice(-1) : next;
}

export function useSidebarMenu() {
  const { pathname } = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [followsRoute, setFollowsRoute] = useState(true);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenus([]);
    setFollowsRoute(true);
  }

  const toggleMenu = (key: string, wasOpen: boolean) => {
    setFollowsRoute(false);
    setOpenMenus(current => onlyLatestOpen(current, wasOpen ? [] : [key]));
  };

  return { openMenus, followsRoute, toggleMenu };
}
