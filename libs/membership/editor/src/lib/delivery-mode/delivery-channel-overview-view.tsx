import { useQuery } from '@apollo/client/react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeliveryChannelCountsDocument,
  DeliverySuggestionCountsDocument,
  MailChannel,
  SubscriptionFlowsDocument,
  UsersByDeliveryChannelDocument,
} from '@wepublish/editor/api';
import { Pagination, useAuthorisation } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { deliveryChannel } from './channels';
import { describeDeliveryChange } from './delivery-change';

const PAGE_SIZE = 20;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

/**
 * Who is on which channel, at a glance: a tile per channel, what waits for a
 * decision, how many automated messages print at all, and the people of one
 * channel with how they got there. Nothing is changed from here.
 */
export function DeliveryChannelOverviewView() {
  const { t } = useTranslation();
  const canSeeFlows = useAuthorisation('CAN_GET_SUBSCRIPTION_FLOWS');

  // Letters first: who is on the default channel is rarely the question.
  const [channel, setChannel] = useState<MailChannel>(MailChannel.Letter);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const counts = useQuery(DeliveryChannelCountsDocument);
  const suggestions = useQuery(DeliverySuggestionCountsDocument);
  const flows = useQuery(SubscriptionFlowsDocument, {
    variables: { defaultFlowOnly: false },
    skip: !canSeeFlows,
  });
  const people = useQuery(UsersByDeliveryChannelDocument, {
    variables: {
      channel,
      search: search || undefined,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    },
  });

  const open =
    (suggestions.data?.deliverySuggestionCounts.toLetter ?? 0) +
    (suggestions.data?.deliverySuggestionCounts.toMail ?? 0);

  const intervals = (flows.data?.subscriptionFlows ?? []).flatMap(
    flow => flow.intervals
  );
  const sent = intervals.filter(interval => interval.mailTemplate);
  const printed = sent.filter(interval => interval.sendAsLetter);

  const nodes = people.data?.usersByDeliveryChannel.nodes ?? [];
  const totalCount = people.data?.usersByDeliveryChannel.totalCount ?? 0;

  const show = (next: MailChannel) => {
    setChannel(next);
    setPage(1);
  };

  return (
    <div>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        }}
      >
        {(counts.data?.deliveryChannelCounts ?? []).map(count => {
          const info = deliveryChannel(count.channel);

          return (
            <Card
              key={count.channel}
              variant="outlined"
            >
              <CardContent>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center' }}
                >
                  <info.icon />
                  <Typography variant="subtitle1">
                    {info.isDefault ?
                      t('deliveryChannel.overview.defaultChannel', {
                        label: t(info.labelKey),
                      })
                    : t(info.labelKey)}
                  </Typography>
                </Stack>
                <Typography
                  variant="h5"
                  sx={{ marginTop: 1 }}
                >
                  {t('deliveryChannel.overview.people', {
                    count: count.userCount,
                  })}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant={count.channel === channel ? 'contained' : 'text'}
                  onClick={() => show(count.channel)}
                >
                  {t('deliveryChannel.overview.showPeople')}
                </Button>
              </CardActions>
            </Card>
          );
        })}

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1">
              {t('deliveryChannel.overview.openSuggestions', { count: open })}
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              size="small"
              component={Link}
              to="/deliverychannel/suggestions"
            >
              {t('deliveryChannel.overview.review')}
            </Button>
          </CardActions>
        </Card>
      </Box>

      {canSeeFlows && flows.data && (
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}
        >
          <Typography variant="body2">
            {t('deliveryChannel.overview.printed', {
              printed: printed.length,
              total: sent.length,
            })}
          </Typography>
          <Button
            size="small"
            component={Link}
            to="/communicationflows/edit/default"
          >
            {t('deliveryChannel.overview.openFlows')}
          </Button>
        </Stack>
      )}

      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          marginTop: 4,
        }}
      >
        <Typography variant="h6">
          {t('deliveryChannel.overview.peopleOn', {
            channel: t(deliveryChannel(channel).labelKey),
          })}
        </Typography>
        <TextField
          size="small"
          label={t('deliveryChannel.overview.search')}
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </Stack>

      <TableContainer sx={{ marginTop: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('deliveryMode.table.user')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('deliveryMode.bulk.history.channel')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('deliveryChannel.overview.lastChange')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map(row => {
              const info = deliveryChannel(row.channel);

              return (
                <TableRow key={row.user.id}>
                  <TableCell>
                    <Link to={`/users/edit/${row.user.id}`}>
                      {[row.user.firstName, row.user.name]
                        .filter(Boolean)
                        .join(' ')}{' '}
                      <Box
                        component="span"
                        sx={{ color: 'text.secondary' }}
                      >
                        {row.user.email}
                      </Box>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={info.colour}
                      icon={<info.icon />}
                      label={t(info.labelKey)}
                    />
                  </TableCell>
                  <TableCell>
                    {describeDeliveryChange(t, row, formatDate) ??
                      t('deliveryChannel.overview.noDecision')}
                  </TableCell>
                </TableRow>
              );
            })}

            {!people.loading && !nodes.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  {t('deliveryChannel.overview.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalCount > PAGE_SIZE && (
        <Box sx={{ marginTop: 1.5 }}>
          <Pagination
            state={{
              page,
              limit: PAGE_SIZE,
              setPage,
              setLimit: () => undefined /* page size is fixed here */,
            }}
            totalCount={totalCount}
          />
        </Box>
      )}
    </div>
  );
}
