import { Box, Divider, Typography } from '@mui/material';
import { VersionHistoryTimeline } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { usePuckRevisionHistory } from './revision-history.context';

export function RevisionHistory() {
  const { t } = useTranslation();
  const history = usePuckRevisionHistory();

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: 600 }}
        >
          {t('versionHistory.title')}
        </Typography>

        <Typography
          variant="body2"
          component="div"
          color="text.secondary"
        >
          {t('versionHistory.subtitle', {
            count: history.totalCount ?? history.revisions.length,
          })}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <VersionHistoryTimeline {...history} />
      </Box>
    </>
  );
}
