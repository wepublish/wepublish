import { Box } from '@mui/material';
import { VersionHistoryTimeline } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { PluginPanelHeader } from '../plugin-panel/plugin-panel-header.component';
import { usePuckRevisionHistory } from './revision-history.context';
import {
  previewedRevisionId,
  usePuckRevisionPreview,
} from './revision-preview.context';

export function RevisionHistory() {
  const { t } = useTranslation();
  const history = usePuckRevisionHistory();
  const preview = usePuckRevisionPreview();
  const { loadRevision, ...timeline } = history;

  return (
    <>
      <PluginPanelHeader
        title={t('versionHistory.title')}
        subtitle={t('versionHistory.subtitle', {
          count: history.totalCount ?? history.revisions.length,
        })}
      />

      <Box sx={{ p: 2 }}>
        <VersionHistoryTimeline
          {...timeline}
          previewingId={previewedRevisionId(preview)}
          onPreview={loadRevision ? preview.preview : undefined}
        />
      </Box>
    </>
  );
}
