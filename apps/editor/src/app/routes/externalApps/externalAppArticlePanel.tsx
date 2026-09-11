import styled from '@emotion/styled';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'rsuite';

import { useExternalAppSrc } from './useExternalAppSrc';

const PanelBody = styled(Drawer.Body)`
  padding: 0;
  height: 100%;
`;

const StyledIframe = styled('iframe')`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
`;

const Centered = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export interface ExternalAppArticlePanelProps {
  app: { id: string; name: string; url: string };
  /** The article the editor has open; the app opens on this one. */
  articleId: string;
}

/**
 * An external app beside the article it is meant to work on (stage B, part 2).
 *
 * The app is told the article in the same url fragment that carries its token,
 * so it needs no article picker. `revision` names what it should read; the
 * draft is what the editor has open.
 *
 * The panel is mounted only while the drawer is open, which is also when the
 * token is minted: the editor asks for no token for a tool nobody opened.
 */
export function ExternalAppArticlePanel({
  app,
  articleId,
}: ExternalAppArticlePanelProps) {
  const { t } = useTranslation();
  const { src, loading, error } = useExternalAppSrc(app, {
    articleId,
    revision: 'draft',
  });

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{app.name}</Drawer.Title>
      </Drawer.Header>

      <PanelBody>
        {loading ?
          <Centered>
            <CircularProgress />
          </Centered>
        : !src ?
          <Box p={3}>
            <Typography color="error">
              {error?.message ||
                t('externalApps.noToken', {
                  defaultValue: 'Could not create a token for this app',
                })}
            </Typography>
          </Box>
        : <StyledIframe
            src={src}
            title={app.name}
            allow="fullscreen; microphone; camera; display-capture"
          />
        }
      </PanelBody>
    </>
  );
}
