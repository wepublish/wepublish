import styled from '@emotion/styled';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  useCreateExternalAppTokenMutation,
  useExternalAppQuery,
} from '@wepublish/editor/api';
import { useEffect, useMemo } from 'react';
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

export function appUrlWithToken(url: string, token: string) {
  const urlWithToken = new URL(url);
  urlWithToken.searchParams.set('token', token);

  return urlWithToken.toString();
}

export function ExternalAppIframeView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data, loading, error } = useExternalAppQuery({
    variables: { externalAppId: id! },
    skip: !id,
  });

  const [createExternalAppToken, { data: tokenData, error: tokenError }] =
    useCreateExternalAppTokenMutation();

  useEffect(() => {
    if (!id) {
      return;
    }

    createExternalAppToken({ variables: { externalAppId: id } }).catch(
      () => undefined
    );
  }, [createExternalAppToken, id]);

  const url = data?.externalApp?.url;
  const token = tokenData?.createExternalAppToken.token;

  const iframeSrc = useMemo(() => {
    if (!url || !token) {
      return null;
    }

    try {
      return appUrlWithToken(url, token);
    } catch {
      return null;
    }
  }, [token, url]);

  if (error || tokenError || (!loading && !data?.externalApp)) {
    return (
      <Box p={3}>
        <Typography color="error">
          {error?.message ||
            tokenError?.message ||
            t('externalApps.notFound', {
              defaultValue: 'External app not found',
            })}
        </Typography>
      </Box>
    );
  }

  if (url && token && !iframeSrc) {
    return (
      <Box p={3}>
        <Typography color="error">
          {t('externalApps.invalidUrl', {
            defaultValue: 'The external app has an invalid url',
          })}
        </Typography>
      </Box>
    );
  }

  if (!iframeSrc) {
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
        src={iframeSrc}
        title={data?.externalApp.name}
        allow="fullscreen; microphone; camera; display-capture"
      />
    </IframeWrapper>
  );
}
