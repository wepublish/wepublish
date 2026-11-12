import { useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';

export type RouteDrawerPaths = {
  readonly list: string;
  readonly create: string;
  readonly edit: `${string}:id${string}`;
};

export type RouteDrawer = {
  readonly open: boolean;
  readonly mode: 'create' | 'edit' | undefined;
  readonly id: string | undefined;
  readonly close: () => void;
};

type DrawerContent = {
  readonly mode: 'create' | 'edit' | undefined;
  readonly id: string | undefined;
};

export function useRouteDrawer(paths: RouteDrawerPaths): RouteDrawer {
  const navigate = useNavigate();
  const creating = useMatch(paths.create) !== null;
  const editMatch = useMatch(paths.edit);
  const editId = editMatch === null ? undefined : editMatch.params['id'];
  const mode =
    editId !== undefined ? 'edit'
    : creating ? 'create'
    : undefined;
  const [last, setLast] = useState<DrawerContent>({ mode, id: editId });

  if (mode !== undefined && (mode !== last.mode || editId !== last.id)) {
    setLast({ mode, id: editId });
  }

  return {
    open: mode !== undefined,
    mode: mode ?? last.mode,
    id: mode === undefined ? last.id : editId,
    close: () => navigate(paths.list),
  };
}
