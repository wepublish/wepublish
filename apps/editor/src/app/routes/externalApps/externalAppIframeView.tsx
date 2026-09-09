import styled from '@emotion/styled';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  useCreateExternalAppTokenMutation,
  useExternalAppQuery,
} from '@wepublish/editor/api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

const IframeWrapper = styled(Box)`
  width: calc(100% + 80px);
  height: calc(100vh + 92px);
  padding: 0;
  margin-top: -60px;
  margin-bottom: -32px;
  margin-left: -40px;
  margin-right: -40px;
  box-sizing: border-box;
`;

const StyledIframe = styled('iframe')`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
`;

export function ExternalAppIframeView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data, loading, error } = useExternalAppQuery({
    variables: { externalAppId: id! },
    skip: !id,
  });

  // The app is told who is sitting in the iframe with a short-lived JWT
  // (`audience` = the app's registered url). It travels in the url fragment,
  // never as a query parameter: fragments reach no server and no log, and the
  // app is expected to strip it from the address bar once it has been traded
  // for its own session.
  const [createExternalAppToken, tokenState] =
    useCreateExternalAppTokenMutation();

  useEffect(() => {
    if (data?.externalApp && !tokenState.called) {
      createExternalAppToken({
        variables: { externalAppId: data.externalApp.id },
      });
    }
  }, [data, createExternalAppToken, tokenState.called]);

  if (loading || tokenState.loading) {
    return (
      <Box
        p={3}
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.externalApp) {
    return (
      <Box p={3}>
        <Typography color="error">
          {error?.message ||
            t('externalApps.notFound', {
              defaultValue: 'External app not found',
            })}
        </Typography>
      </Box>
    );
  }

  // A token that cannot be minted is shown, not swallowed: loading the app
  // without one would silently sign the editor out of it.
  if (tokenState.error) {
    return (
      <Box p={3}>
        <Typography color="error">{tokenState.error.message}</Typography>
      </Box>
    );
  }

  const token = tokenState.data?.createExternalAppToken.token;

  if (!token) {
    return (
      <Box
        p={3}
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <IframeWrapper>
      <StyledIframe
        src={`${data.externalApp.url}#token=${encodeURIComponent(token)}`}
        title={data.externalApp.name}
        allow="fullscreen; microphone; camera; display-capture"
      />
    </IframeWrapper>
  );
}
