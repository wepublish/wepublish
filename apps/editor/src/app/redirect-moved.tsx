import { Navigate, useLocation } from 'react-router-dom';

/** Old links to a moved section, with the rest of their path and query. */
export const RedirectMoved = ({ from, to }: { from: string; to: string }) => {
  const { pathname, search } = useLocation();

  return (
    <Navigate
      to={to + pathname.slice(from.length) + search}
      replace
    />
  );
};
