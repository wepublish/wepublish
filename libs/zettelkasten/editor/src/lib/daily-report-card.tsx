import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { useZettelkastenDailyReportQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

import { parseDailyReport } from './daily-report';

/** The payload is cast, not validated: eintraege is whatever the door sent. */
type Payload = { eintraege?: unknown };

/** The last journal entries of the knowledge base: what came in, what the lint found. */
export function DailyReportCard() {
  const { t } = useTranslation();
  // One run, and never in the cache: the entries carry the deadlines of the
  // day with the names of private persons, and the card needs four head lines
  // of them. Shortening them at the door itself is the next step.
  const { data, loading, error } = useZettelkastenDailyReportQuery({
    variables: { count: 1 },
    fetchPolicy: 'no-cache',
  });
  const eintraege = (data?.zettelkastenDailyReport as Payload | undefined)
    ?.eintraege;
  const entries = parseDailyReport(
    Array.isArray(eintraege) ?
      eintraege.filter((entry): entry is string => typeof entry === 'string')
    : []
  ).reverse();

  if (loading) {
    return (
      <Typography variant="body2">
        {t('zettelkasten.report.loading')}
      </Typography>
    );
  }
  if (error) {
    return <Typography color="error">{error.message}</Typography>;
  }
  if (entries.length === 0) {
    return (
      <Typography variant="body2">{t('zettelkasten.report.empty')}</Typography>
    );
  }

  return (
    <List dense>
      {entries.map(entry => (
        <ListItem
          key={`${entry.date}-${entry.run}`}
          disableGutters
        >
          <ListItemText
            primary={`${entry.date} · ${entry.run}`}
            secondary={
              <>
                {entry.feeds && (
                  <Typography
                    component="span"
                    variant="body2"
                    display="block"
                  >
                    {t('zettelkasten.report.feeds')}: {entry.feeds}
                  </Typography>
                )}
                {entry.lint && (
                  <Typography
                    component="span"
                    variant="body2"
                    display="block"
                  >
                    {t('zettelkasten.report.lint')}: {entry.lint}
                  </Typography>
                )}
                {entry.night && (
                  <Typography
                    component="span"
                    variant="body2"
                    display="block"
                  >
                    {t('zettelkasten.report.night')}: {entry.night}
                  </Typography>
                )}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
