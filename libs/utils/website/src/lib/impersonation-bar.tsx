import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import {
  CurrentSessionDocument,
  EndImpersonationDocument,
} from '@wepublish/website/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Bar = styled('div')`
  position: fixed;
  inset: auto 0 0 0;
  z-index: 9998;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: #b45309;
  color: white;
  font-size: 14px;
`;

const EndButton = styled('button')`
  padding: 6px 16px;
  border: 1px solid white;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
`;

export function ImpersonationBar({
  navigate = url => window.location.assign(url),
}: {
  navigate?: (url: string) => void;
}) {
  const { t } = useTranslation();
  const { user, hasUser, logout } = useUser();
  const { data } = useQuery(CurrentSessionDocument, { skip: !hasUser });
  const [endImpersonation] = useMutation(EndImpersonationDocument);
  const [ending, setEnding] = useState(false);

  const supporter = hasUser && data?.currentSession.impersonatedBy;

  if (!supporter) {
    return null;
  }

  const end = async () => {
    setEnding(true);
    await endImpersonation().catch(() => undefined);
    await logout().catch(() => undefined);
    navigate('/');
  };

  return (
    <Bar role="status">
      <span>
        {t('login.impersonation.active', {
          name:
            [user?.firstName, user?.name].filter(Boolean).join(' ') ||
            user?.email ||
            '',
          supporter,
        })}
      </span>
      <EndButton
        type="button"
        disabled={ending}
        onClick={end}
      >
        {t('login.impersonation.end')}
      </EndButton>
    </Bar>
  );
}
