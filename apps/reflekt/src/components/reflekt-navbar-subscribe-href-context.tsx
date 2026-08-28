import { createContext, ReactNode, useCallback, useState } from 'react';

export const DEFAULT_NAVBAR_SUBSCRIBE_HREF = '/mitmachen';

export const NavbarSubscribeHrefContext = createContext<{
  href: string;
  setHref: (href: string | undefined) => void;
}>({
  href: DEFAULT_NAVBAR_SUBSCRIBE_HREF,
  setHref: () => undefined,
});

export const NavbarSubscribeHrefProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [href, setHrefState] = useState(DEFAULT_NAVBAR_SUBSCRIBE_HREF);

  const setHref = useCallback(
    (next: string | undefined) =>
      setHrefState(next || DEFAULT_NAVBAR_SUBSCRIBE_HREF),
    []
  );

  return (
    <NavbarSubscribeHrefContext.Provider value={{ href, setHref }}>
      {children}
    </NavbarSubscribeHrefContext.Provider>
  );
};
