import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Box, CircularProgress } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { ExternalAppDocument } from '@wepublish/editor/api';
import { PageTitle } from '@wepublish/ui/editor';
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

  const { data, loading } = useQuery(ExternalAppDocument, {
    variables: { externalAppId: id! },
    skip: !id,
  });

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!data?.externalApp) {
    return (
      <Box
        sx={{
          p: 3,
        }}
      >
        <PageTitle>{t('externalApps.notFound')}</PageTitle>
      </Box>
    );
  }

  return (
    <IframeWrapper>
      <PageTitle sx={visuallyHidden}>{data.externalApp.name}</PageTitle>
      <StyledIframe
        src={data.externalApp.url}
        title={data.externalApp.name}
        allow="fullscreen; microphone; camera; display-capture"
      />
    </IframeWrapper>
  );
}
