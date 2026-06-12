import { ListViewContainer, ListViewHeader } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import {
  useMailTemplatePlaceholdersQuery,
  useMailTemplateQuery,
} from '@wepublish/editor/api';
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { DEFAULT_QUERY_OPTIONS } from '../common';
import { formatPlaceholder, getPlaceholderSyntax } from './placeholder-syntax';

export function PlaceholderList() {
  const { t } = useTranslation();

  const { data: placeholderData } = useMailTemplatePlaceholdersQuery(
    DEFAULT_QUERY_OPTIONS()
  );
  const { data: mailTemplate } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());

  const syntax = getPlaceholderSyntax(mailTemplate?.provider.type);
  const groups = placeholderData?.mailTemplatePlaceholders ?? [];

  const eventTitle = (event: string): string => {
    const lower = event.toLowerCase();

    return t(`subscriptionFlow.${lower}`, {
      defaultValue: t(`systemMails.events.${lower}`, {
        defaultValue: event,
      }),
    });
  };

  const describe = (key: string): string =>
    t(`placeholderList.description.${key}`, { defaultValue: '-' });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('placeholderList.header')}</h2>
          <Typography variant="subtitle1">
            {t('placeholderList.subtitle')}
          </Typography>
        </ListViewHeader>
      </ListViewContainer>

      {groups.map(group => (
        <Grid
          key={group.event}
          container
          spacing={2}
          sx={{ marginTop: 4 }}
        >
          <Grid xs={24}>
            <h2>{eventTitle(group.event)}</h2>
          </Grid>

          <Grid xs={24}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>{t('placeholderList.placeholder')}</strong>
                    </TableCell>

                    <TableCell>
                      <strong>{t('placeholderList.descriptionTitle')}</strong>
                    </TableCell>

                    <TableCell>
                      <strong>{t('placeholderList.example')}</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {group.placeholders.map(placeholder => (
                    <TableRow key={placeholder.key}>
                      <TableCell>
                        <code>
                          {formatPlaceholder(placeholder.key, syntax)}
                        </code>
                      </TableCell>
                      <TableCell>{describe(placeholder.key)}</TableCell>
                      <TableCell>{placeholder.example}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      ))}
    </>
  );
}
