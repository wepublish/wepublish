import { useQuery } from '@apollo/client/react';
import {
  DeliveryModeBulkChangesDocument,
  MailTemplateDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
} from '@wepublish/editor/api';
import {
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { describeAudience } from '../mail-send/audience/audience-summary';

const TAKE = 20;

export type DeliveryModeBulkChangesProps = {
  /** Bump to reload, e.g. right after a switch went through. */
  refreshKey?: number;
};

/**
 * The record of bulk switches: who moved which audience to which channel,
 * and how many it touched. The filter is read back as phrases, so the list
 * answers "why is this person on letters" without opening anything.
 */
export function DeliveryModeBulkChanges({
  refreshKey = 0,
}: DeliveryModeBulkChangesProps) {
  const { t, i18n } = useTranslation();
  const { data, refetch } = useQuery(DeliveryModeBulkChangesDocument, {
    variables: { skip: 0, take: TAKE },
    fetchPolicy: 'cache-and-network',
  });
  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);
  const { data: templateData } = useQuery(MailTemplateDocument);

  useEffect(() => {
    if (refreshKey > 0) {
      refetch();
    }
  }, [refreshKey, refetch]);

  const lookups = useMemo(() => {
    const names = (rows: { id: string; name: string }[] | undefined) =>
      new Map((rows ?? []).map(row => [row.id, row.name]));
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString(i18n?.language ?? 'de-CH');

    return {
      t,
      memberPlans: names(memberPlanData?.memberPlans.nodes),
      paymentMethods: names(paymentMethodData?.paymentMethods),
      templates: names(templateData?.mailTemplates),
      formatDate,
    };
  }, [t, i18n, memberPlanData, paymentMethodData, templateData]);

  const changes = data?.deliveryModeBulkChanges.nodes ?? [];

  return (
    <Stack
      spacing={1}
      style={{ marginTop: 24 }}
    >
      <Typography variant="h6">
        {t('deliveryMode.bulk.history.title')}
      </Typography>

      {!changes.length ?
        <Typography sx={{ color: 'text.secondary' }}>
          {t('deliveryMode.bulk.history.empty')}
        </Typography>
      : <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('deliveryMode.bulk.history.when')}</TableCell>
                <TableCell>{t('deliveryMode.bulk.history.who')}</TableCell>
                <TableCell>{t('deliveryMode.bulk.history.channel')}</TableCell>
                <TableCell align="right">
                  {t('deliveryMode.bulk.history.people')}
                </TableCell>
                <TableCell align="right">
                  {t('deliveryMode.bulk.history.changed')}
                </TableCell>
                <TableCell align="right">
                  {t('deliveryMode.bulk.history.skipped')}
                </TableCell>
                <TableCell>{t('deliveryMode.bulk.history.filter')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changes.map(change => (
                <TableRow key={change.id}>
                  <TableCell style={{ whiteSpace: 'nowrap' }}>
                    {new Date(change.createdAt).toLocaleString(
                      i18n?.language ?? 'de-CH'
                    )}
                  </TableCell>
                  <TableCell>
                    {change.changedBy ?
                      <Link to={`/users/edit/${change.changedBy.id}`}>
                        {[change.changedBy.firstName, change.changedBy.name]
                          .filter(Boolean)
                          .join(' ') || change.changedBy.email}
                      </Link>
                    : t('deliveryMode.bulk.history.unknownUser')}
                  </TableCell>
                  <TableCell>
                    {t(`deliveryMode.channel.${change.channel}`)}
                  </TableCell>
                  <TableCell align="right">{change.userCount}</TableCell>
                  <TableCell align="right">{change.changed}</TableCell>
                  <TableCell align="right">
                    {change.skippedWithoutAddress}
                  </TableCell>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      useFlexGap
                      sx={{ flexWrap: 'wrap' }}
                    >
                      {describeAudience(
                        change.audience as Record<string, unknown>,
                        lookups
                      ).map(phrase => (
                        <Chip
                          key={phrase}
                          size="small"
                          label={phrase}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      }
    </Stack>
  );
}
