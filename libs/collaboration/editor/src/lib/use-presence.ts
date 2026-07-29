import { LocalStorageKey, useMeQuery } from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { useContext, useEffect, useId, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';

export const DEFAULT_COLLABORATION_URL = 'ws://localhost:4100';

export interface CollaborationUser {
  id: string;
  name: string;
}

export function usePresence(id: string) {
  const { data } = useMeQuery({
    fetchPolicy: 'cache-only',
  });

  const token = localStorage.getItem(LocalStorageKey.SessionToken);
  const userId = data?.me?.id;
  const userName =
    `${data?.me?.firstName ?? ''} ${data?.me?.name ?? ''}`.trim();

  const [others, setOthers] = useState<Map<string, CollaborationUser>>(
    () => new Map()
  );

  useEffect(() => {
    if (!id) {
      if (others.size) {
        setOthers(new Map());
      }

      return;
    }

    const doc = new Doc();
    const provider = new WebsocketProvider(DEFAULT_COLLABORATION_URL, id, doc, {
      params: { token: token ?? '' },
    });
    const { awareness } = provider;

    if (userId && userName) {
      awareness.setLocalStateField('user', {
        id: userId,
        name: userName,
      });
    }

    const readOthers = () => {
      const next = new Map<string, CollaborationUser>();

      awareness.getStates().forEach(state => {
        const { user } = state as { user?: CollaborationUser };

        if (user && user.id !== userId) {
          next.set(user.id, user);
        }
      });

      setOthers(old => {
        // Don't set state if both are empty
        if (old.size || next.size) {
          return next;
        }

        return old;
      });
    };

    const unload = () => {
      awareness.off('change', readOthers);
      provider.destroy();
      doc.destroy();
      window.removeEventListener('beforeunload', unload);
    };

    awareness.on('change', readOthers);
    window.addEventListener('beforeunload', unload);
    readOthers();

    return unload;
  }, [id, token, userId, userName]);

  return [others] as const;
}
