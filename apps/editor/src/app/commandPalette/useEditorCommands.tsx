import {
  allowedCommands,
  AuthContext,
  type Command,
  useFeatures,
} from '@wepublish/ui/editor';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { editorCommands } from './commands';

export function useEditorCommands(): Command[] {
  const { t, i18n } = useTranslation();
  const { session } = useContext(AuthContext);
  const features = useFeatures();

  const granted = useMemo(() => {
    const roles = session?.sessionRoles;

    return roles ?
        new Set(
          roles.flatMap(role =>
            role.permissions.map(permission => permission.id)
          )
        )
      : undefined;
  }, [session]);

  return useMemo(
    () => allowedCommands(editorCommands(t, i18n), granted, features),
    [features, granted, i18n, t]
  );
}
