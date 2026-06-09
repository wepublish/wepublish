import styled from '@emotion/styled';
import {
  AppBar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef, ReactElement, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdLock } from 'react-icons/md';

import { BlockList } from '../atoms/blockList';
import { BlockMap } from '../blocks/blockMap';
import { BlockValue } from '../blocks/types';

export interface RevisionContentPreviewProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  title?: string | null;
  subtitle?: string | null;
  blocks: BlockValue[];
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return (
    <Slide
      direction="up"
      ref={ref}
      {...props}
    />
  );
});

// The block editor is shown verbatim but made non-interactive so the version
// can be read without any risk of editing it.
const ReadOnlyBlocks = styled.div`
  pointer-events: none;
  user-select: text;
  padding: 24px 0 64px;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
`;

const Header = styled.div`
  padding: 24px 24px 8px;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
`;

export function RevisionContentPreview({
  open,
  onClose,
  loading = false,
  title,
  subtitle,
  blocks,
}: RevisionContentPreviewProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar
        sx={{ position: 'sticky' }}
        color="default"
        elevation={1}
      >
        <Toolbar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {t('versionHistory.previewTitle')}
            </Typography>
            {title && (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {title}
              </Typography>
            )}
          </Box>

          <Chip
            size="small"
            icon={<MdLock />}
            label={t('versionHistory.readOnly')}
            sx={{ mr: 1 }}
          />

          <IconButton
            edge="end"
            onClick={onClose}
            aria-label={t('versionHistory.close')}
          >
            <MdClose />
          </IconButton>
        </Toolbar>
      </AppBar>

      {loading ?
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      : <>
          {subtitle && (
            <Header>
              <Typography
                variant="subtitle1"
                color="text.secondary"
              >
                {subtitle}
              </Typography>
            </Header>
          )}

          <ReadOnlyBlocks>
            <BlockList
              value={blocks}
              onChange={() => undefined}
              disabled
              blockMap={BlockMap}
            />
          </ReadOnlyBlocks>
        </>
      }
    </Dialog>
  );
}
