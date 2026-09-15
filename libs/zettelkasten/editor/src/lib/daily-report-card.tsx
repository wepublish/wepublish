import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { useZettelkastenDailyReportQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

import { parseDailyReport } from './daily-report';

/** The payload is cast, not validated: eintraege is whatever the door sent. */
type Payload = { eintraege?: unknown };

/** The last journal entries of the knowledge base: what came in, what the lint found. */
export function DailyReportCard() {
  const { t } = useTranslation();
  // One run, and never in the cache: the door already shortens each entry to
  // its head lines, so the deadlines and the register notices that name
  // private persons never leave it. The parser only picks the four lines it
  // shows out of what arrives; no-cache keeps even those out of Apollo.
  const { data, loading, error } = useZettelkastenDailyReportQuery({
    variables: { count: 1 },
    fetchPolicy: 'no-cache',
  });
  const eintraege = (data?.zettelkastenDailyReport as Payload | undefined)
    ?.eintraege;
  const delivered = Array.isArray(eintraege) ? eintraege : [];
  const entries = parseDailyReport(
    delivered.filter((entry): entry is string => typeof entry === 'string')
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
  // Entries arrived and none of them could be decomposed. «Nothing found»
  // would be a claim about the holdings, and here it would be a false one:
  // the card says that it could not read the report, and nothing more.
  if (entries.length === 0 && delivered.length > 0) {
    return (
      <Typography variant="body2">
        {t('zettelkasten.report.unreadable')}
      </Typography>
    );
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
