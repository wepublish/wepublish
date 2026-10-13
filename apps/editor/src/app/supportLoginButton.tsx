import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  getSettings,
  SupportLoginEnabledDocument,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from 'rsuite';

import { startSupportLogin } from './supportLogin';

const SupportLogin = styled.div`
  display: grid;
`;

export function SupportLoginButton({
  navigate = url => window.location.assign(url),
}: {
  navigate?: (url: string) => void;
}) {
  const { t } = useTranslation();
  const { data } = useQuery(SupportLoginEnabledDocument);
  const [starting, setStarting] = useState(false);

  if (!data?.supportLoginEnabled) {
    return null;
  }

  const start = async () => {
    setStarting(true);

    try {
      navigate(
        await startSupportLogin({
          oneUrl: process.env.WEP_ONE_URL || getSettings().wepOneURL,
          origin: window.location.origin,
        })
      );
    } catch {
      setStarting(false);
    }
  };

  return (
    <SupportLogin>
      <Divider />
      <Button
        appearance="subtle"
        loading={starting}
        onClick={start}
      >
        {t('login.support.button')}
      </Button>
    </SupportLogin>
  );
}
