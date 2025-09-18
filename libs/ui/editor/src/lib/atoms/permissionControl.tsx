import { ComponentType, PropsWithChildren, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from 'rsuite';

import { AuthContext } from '../authContext';

interface RejectionMessageProps {
  requiredPermissions: string[];
}

export function RejectionMessage({
  requiredPermissions,
}: RejectionMessageProps) {
  const { t } = useTranslation();
  return (
    <Message
      type="error"
      header={t('permissions.noAccess')}
      showIcon
    >
      {t('permissions.contactAdmin', {
        permissions: requiredPermissions.join(', '),
      })}
    </Message>
  );
}

interface PermissionControlProps {
  qualifyingPermissions: string[];
  showRejectionMessage?: boolean;
}

export function PermissionControl({
  children,
  qualifyingPermissions,
  showRejectionMessage,
}: PropsWithChildren<PermissionControlProps>) {
  const roles = useContext(AuthContext)?.session?.sessionRoles;

  const isAuthorized = useMemo(() => {
    if (!roles) {
      return true;
    }

    return qualifyingPermissions.some(qualifyingPermission =>
      roles.some(role =>
        role.permissions.some(
          userPermission => userPermission.id === qualifyingPermission
        )
      )
    );
  }, [qualifyingPermissions, roles]);

  if (isAuthorized) {
    return <>{children}</>;
  }

  return showRejectionMessage ?
      <RejectionMessage requiredPermissions={qualifyingPermissions} />
    : null;
}

export const createCheckedPermissionComponent =
  (permissions: string[], showRejectionMessage?: boolean) =>
  <
    // eslint-disable-next-line @typescript-eslint/ban-types
    P extends object,
  >(
    ControlledComponent: ComponentType<P>
  ) =>
  (props: P) => {
    return (
      <PermissionControl
        qualifyingPermissions={permissions}
        showRejectionMessage={showRejectionMessage ?? true}
      >
        <ControlledComponent {...props} />
      </PermissionControl>
    );
  };

export function useAuthorisation(permissionID: string) {
  return useContext(AuthContext)?.session?.sessionRoles?.some(role =>
    role.permissions.some(permission => permission.id === permissionID)
  );
}
