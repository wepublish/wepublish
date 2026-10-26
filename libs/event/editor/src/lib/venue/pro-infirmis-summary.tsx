import { Chip, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdOpenInNew } from 'react-icons/md';

const LABEL_KEYS = ['name', 'Name', 'title', 'Title', 'label'] as const;

const labelOf = (pictogram: unknown) => {
  if (typeof pictogram === 'string') {
    return pictogram;
  }

  if (pictogram && typeof pictogram === 'object') {
    const record = pictogram as Record<string, unknown>;
    const key = LABEL_KEYS.find(name => typeof record[name] === 'string');

    return key ? (record[key] as string) : null;
  }

  return null;
};

export const pictogramLabels = (pictograms: unknown): string[] =>
  Array.isArray(pictograms) ?
    pictograms.map(labelOf).filter((label): label is string => !!label)
  : [];

export interface ProInfirmisSummaryProps {
  idSource?: string | null;
  detailUrl?: string | null;
  pictograms?: unknown;
}

export function ProInfirmisSummary({
  idSource,
  detailUrl,
  pictograms,
}: ProInfirmisSummaryProps) {
  const { t } = useTranslation();

  if (!idSource) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {t('agenda.venues.proInfirmis.none')}
      </Typography>
    );
  }

  const labels = pictogramLabels(pictograms);

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {t('agenda.venues.proInfirmis.readOnly')}
      </Typography>

      {labels.length > 0 ?
        <Stack
          direction="row"
          useFlexGap
          component="ul"
          sx={{ flexWrap: 'wrap', gap: 1, listStyle: 'none', p: 0, m: 0 }}
          aria-label={t('agenda.venues.proInfirmis.pictograms')}
        >
          {labels.map(label => (
            <li key={label}>
              <Chip
                size="small"
                variant="outlined"
                label={label}
              />
            </li>
          ))}
        </Stack>
      : <Typography variant="body2">
          {t('agenda.venues.proInfirmis.noPictograms')}
        </Typography>
      }

      {detailUrl && (
        <Link
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          {t('agenda.venues.proInfirmis.open')}
          <MdOpenInNew aria-hidden />
        </Link>
      )}
    </Stack>
  );
}
