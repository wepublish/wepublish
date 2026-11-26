import { Navigate, useLocation } from 'react-router-dom';

export const RedirectMoved = ({ from, to }: { from: string; to: string }) => {
  const { pathname, search } = useLocation();

  return (
    <Navigate
      to={to + pathname.slice(from.length) + search}
      replace
    />
  );
};
