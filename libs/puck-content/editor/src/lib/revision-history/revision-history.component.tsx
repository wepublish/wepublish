import { faker } from '@faker-js/faker';
import { Box, Divider, Typography } from '@mui/material';
import {
  enqueueSnackbar,
  VersionHistoryRevision,
  VersionHistoryTimeline,
} from '@wepublish/ui/editor';
import nanoid from 'nanoid';
import { useTranslation } from 'react-i18next';

const revisions: VersionHistoryRevision[] = Array.from(
  new Array(10),
  (_, i) => ({
    id: nanoid(),
    createdAt: faker.date.recent({ days: 10 - i }).toISOString(),
    publishedAt: i % 3 === 1 ? faker.date.recent().toISOString() : null,
    title: faker.commerce.productName(),
    author: {
      firstName: faker.person.firstName(),
      name: faker.person.lastName(),
    },
  })
).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const publishedId = revisions.find(revision => revision.publishedAt)?.id;

export function RevisionHistory() {
  const { t } = useTranslation();

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
          {t('versionHistory.subtitle', { count: revisions.length })}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <VersionHistoryTimeline
          revisions={revisions}
          draftId={revisions[0].id}
          publishedId={publishedId}
          onRestore={revisionId => console.warn(revisionId)}
          onPreview={() =>
            enqueueSnackbar(t('', 'Preview is not available yet'), {
              variant: 'info',
            })
          }
        />
      </Box>
    </>
  );
}
