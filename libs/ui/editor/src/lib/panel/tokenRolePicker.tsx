import { useQuery } from '@apollo/client/react';
import { UserRoleListDocument } from '@wepublish/editor/api';
import { CheckPicker } from 'rsuite';

export interface TokenRolePickerProps {
  value: string[];
  onChange(roleIDs: string[]): void;
  disabled?: boolean;
}

/** Picks the user roles a token acts with, the same roles users get. */
export function TokenRolePicker({
  value,
  onChange,
  disabled,
}: TokenRolePickerProps) {
  const { data, loading } = useQuery(UserRoleListDocument, {
    variables: { take: 200 },
  });

  return (
    <CheckPicker
      block
      placement="auto"
      value={value}
      disabled={disabled}
      loading={loading}
      data={(data?.userRoles.nodes ?? []).map(role => ({
        value: role.id,
        label: role.name,
      }))}
      onChange={roleIDs => onChange(roleIDs ?? [])}
    />
  );
}
