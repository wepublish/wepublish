import styled from '@emotion/styled';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useExternalAppQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { useExternalAppSrc } from './useExternalAppSrc';

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

  const app = data?.externalApp;
  const {
    src,
    loading: tokenLoading,
    error: tokenError,
  } = useExternalAppSrc(app);

  if (loading || (app && tokenLoading)) {
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

  if (error || !app) {
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

  if (tokenError || !src) {
    return (
      <Box p={3}>
        <Typography color="error">
          {tokenError?.message ||
            t('externalApps.noToken', {
              defaultValue: 'Could not create a token for this app',
            })}
        </Typography>
      </Box>
    );
  }

  return (
    <IframeWrapper>
      <StyledIframe
        src={src}
        title={app.name}
        allow="fullscreen; microphone; camera; display-capture"
      />
    </IframeWrapper>
  );
}
