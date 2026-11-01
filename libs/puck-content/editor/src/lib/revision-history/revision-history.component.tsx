import { Box, Divider, Typography } from '@mui/material';
import { VersionHistoryTimeline } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { usePuckRevisionHistory } from './revision-history.context';
import {
  previewedRevisionId,
  usePuckRevisionPreview,
} from './revision-preview.context';

export function RevisionHistory() {
  const { t } = useTranslation();
  const history = usePuckRevisionHistory();
  const preview = usePuckRevisionPreview();
  const { loadRevision, canRestore = true, ...timeline } = history;

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
        <VersionHistoryTimeline
          {...timeline}
          canRestore={!!loadRevision && canRestore}
          confirmRestore={false}
          previewingId={previewedRevisionId(preview)}
          restoringId={preview.restoringId}
          onPreview={loadRevision ? preview.preview : undefined}
          onRestore={preview.restore}
        />
      </Box>
    </>
  );
}
