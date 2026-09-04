import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { useZettelkastenDailyReportQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

import { parseDailyReport } from './daily-report';

type Payload = { eintraege: string[] };

/** The last journal entries of the knowledge base: what came in, what the lint found. */
export function DailyReportCard() {
  const { t } = useTranslation();
  const { data, loading, error } = useZettelkastenDailyReportQuery({
    variables: { count: 3 },
  });
  const entries = parseDailyReport(
    (data?.zettelkastenDailyReport as Payload | undefined)?.eintraege ?? []
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
