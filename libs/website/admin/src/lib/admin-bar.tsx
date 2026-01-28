import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
} from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { MdAdminPanelSettings, MdPreview } from 'react-icons/md';
import { PREVIEW_MODE_KEY } from './preview-link';
import { CanPreview } from '@wepublish/permissions';
import { ComponentProps, memo, useEffect, useMemo } from 'react';
import { useApolloClient } from '@apollo/client';
import { useSessionStorage } from '@wepublish/ui';
import styled from '@emotion/styled';

export const AdminBarWrapper = styled(SpeedDial)`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing(2)};
  right: ${({ theme }) => theme.spacing(2)};
`;

export const AdminBar = memo(() => {
  const { user } = useUser();
  const client = useApolloClient();
  const theme = useTheme();

  const canPreview = useMemo(
    () => user?.permissions.includes(CanPreview.id),
    [user?.permissions]
  );
  const [isPreview, prevIsPreview, setIsPreview] = useSessionStorage(
    PREVIEW_MODE_KEY,
    {
      defaultValue: false,
      serialize: value => Number(value).toString(),
      deserialize: value => !!Number(value),
    }
  );

  const actions = useMemo(() => {
    const act = [] as ComponentProps<typeof SpeedDialAction>[];

    if (canPreview) {
      act.push({
        icon: (
          <MdPreview
            size={24}
            color={isPreview ? theme.palette.primary.main : undefined}
          />
        ),
        tooltipTitle: isPreview ? 'Disable Preview' : 'Activate Preview',
        onClick: () => setIsPreview(!isPreview),
      });
    }

    return act;
  }, [canPreview, isPreview, setIsPreview, theme.palette.primary.main]);

  // Reload data when isPreview is changed
  useEffect(() => {
    if (prevIsPreview.current !== isPreview && canPreview) {
      client.reFetchObservableQueries();
    }
  }, [client, isPreview, canPreview, prevIsPreview]);

  if (!actions.length) {
    return;
  }

  return (
    <AdminBarWrapper
      ariaLabel="Admin bar"
      icon={<SpeedDialIcon icon={<MdAdminPanelSettings size={24} />} />}
    >
      {actions.map((action, index) => (
        <SpeedDialAction
          key={index}
          {...action}
        />
      ))}
    </AdminBarWrapper>
  );
});
