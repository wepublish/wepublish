import { ListViewContainer, ListViewHeader } from '@wepublish/ui/editor';
import {
  PlaceholderScope,
  useMailTemplatePlaceholderGroupsQuery,
  useMailTemplateQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
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

export function PlaceholderList() {
  const { t } = useTranslation();

  const { data: providerData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const { data: groupsData } = useMailTemplatePlaceholderGroupsQuery(
    DEFAULT_QUERY_OPTIONS()
  );

  const syntax = providerData?.provider.placeholderSyntax ?? {
    open: '{{',
    close: '}}',
  };
  const buildToken = (key: string) => `${syntax.open}${key}${syntax.close}`;

  const groupTitle = (group: {
    scope: PlaceholderScope;
    event: string;
  }): string => {
    if (group.scope === PlaceholderScope.SubscriptionEvent) {
      return t(`subscriptionFlow.${group.event.toLowerCase()}`, {
        defaultValue: group.event,
      });
    }
    if (group.scope === PlaceholderScope.UserEvent) {
      return t(`systemMails.events.${group.event.toLowerCase()}`, {
        defaultValue: group.event,
      });
    }
    return group.event;
  };

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

      {groupsData?.mailTemplatePlaceholderGroups.map(group => (
        <Grid
          key={`${group.scope}:${group.event}`}
          container
          spacing={2}
          sx={{ marginTop: 4 }}
        >
          <Grid xs={24}>
            <h2>{groupTitle(group)}</h2>
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
                        <code>{placeholder.key}</code>
                      </TableCell>
                      <TableCell>
                        {t(placeholder.description, {
                          defaultValue: placeholder.key,
                        })}
                      </TableCell>
                      <TableCell>
                        <code>{buildToken(placeholder.key)}</code>
                      </TableCell>
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
