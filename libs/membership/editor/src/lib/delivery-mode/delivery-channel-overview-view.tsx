import { useQuery } from '@apollo/client/react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
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
  SystemMailsDocument,
  UserEvent,
  UsersByDeliveryChannelDocument,
} from '@wepublish/editor/api';
import { Pagination, useAuthorisation } from '@wepublish/ui/editor';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSwapHoriz } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { deliveryChannel } from './channels';
import { describeDeliveryChange } from './delivery-change';

const PAGE_SIZE = 20;

/** Equal-height tiles whose link texts sit on one line across the row. */
const TILE = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
} as const;
const ACTION_AREA = {
  ...TILE,
  alignItems: 'stretch',
  justifyContent: 'flex-start',
} as const;

/** A strip flush with the tile's top edge, naming what the tile is about. */
const TileHeading = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="overline"
    sx={{
      display: 'block',
      px: 2,
      py: 0.5,
      bgcolor: 'action.hover',
      borderBottom: 1,
      borderColor: 'divider',
      color: 'text.secondary',
      lineHeight: 2,
      // One line, whatever the role in brackets adds.
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {children}
  </Typography>
);

/** The quiet line between a tile's title row and its big number. */
const TileNote = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="caption"
    sx={{ display: 'block', color: 'text.secondary' }}
  >
    {children}
  </Typography>
);

/** Reads as a link but is only text: the tile around it is the control. */
const TileLink = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="body2"
    sx={{ px: 2, pb: 1.5, color: 'primary.main', fontWeight: 500 }}
  >
    {children}
  </Typography>
);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

/**
 * Who is on which channel, at a glance: a tile per channel, what waits for a
 * decision, how many automated messages print at all, and the people of one
 * channel with how they got there. Nothing is changed from here.
 */
export function DeliveryChannelOverviewView() {
  const { t } = useTranslation();
  // The automated messages are the subscription flows' events plus the
  // account mails; the coverage shows only to those who may see both.
  const canSeeFlows = useAuthorisation('CAN_GET_SUBSCRIPTION_FLOWS');
  const canSeeSystemMails = useAuthorisation('CAN_GET_SYSTEM_MAILS');
  const canSeeCoverage = !!canSeeFlows && !!canSeeSystemMails;

  // Letters first: who is on the default channel is rarely the question.
  const [channel, setChannel] = useState<MailChannel>(MailChannel.Letter);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const counts = useQuery(DeliveryChannelCountsDocument);
  const suggestions = useQuery(DeliverySuggestionCountsDocument);
  const flows = useQuery(SubscriptionFlowsDocument, {
    variables: { defaultFlowOnly: false },
    skip: !canSeeCoverage,
  });
  const systemMails = useQuery(SystemMailsDocument, {
    skip: !canSeeCoverage,
  });
  const people = useQuery(UsersByDeliveryChannelDocument, {
    variables: {
      channel,
      search: search || undefined,
      skip: (page - 1) * limit,
      take: limit,
    },
  });

  const open =
    (suggestions.data?.deliverySuggestionCounts.toLetter ?? 0) +
    (suggestions.data?.deliverySuggestionCounts.toMail ?? 0);

  const intervals = (flows.data?.subscriptionFlows ?? []).flatMap(
    flow => flow.intervals
  );
  // Account mails are automated messages too; they only ever go by email,
  // and a test mail is not a message to anyone.
  const sent: { sendAsLetter: boolean }[] = [
    ...intervals.filter(interval => interval.mailTemplate),
    ...(systemMails.data?.systemMails ?? [])
      .filter(mail => mail.mailTemplate && mail.event !== UserEvent.TestMail)
      .map(() => ({ sendAsLetter: false })),
  ];

  const coverageReady = canSeeCoverage && !!flows.data && !!systemMails.data;

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
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        }}
      >
        {(counts.data?.deliveryChannelCounts ?? []).map(count => {
          const info = deliveryChannel(count.channel);

          const active = count.channel === channel;

          return (
            // The tile itself says whose people the list below shows.
            <Card
              key={count.channel}
              variant="outlined"
              aria-current={active ? 'true' : undefined}
              sx={{
                ...TILE,
                ...(active && {
                  borderColor: 'primary.main',
                  boxShadow: theme =>
                    `inset 0 0 0 1px ${theme.vars.palette.primary.main}`,
                }),
              }}
            >
              {/* The whole tile is the button; the link text at the foot
                  only says what clicking does. */}
              <CardActionArea
                sx={ACTION_AREA}
                onClick={() => show(count.channel)}
              >
                <TileHeading>
                  {t(
                    info.isDefault ?
                      'deliveryChannel.overview.channelHeadingDefault'
                    : 'deliveryChannel.overview.channelHeadingAlternative'
                  )}
                </TileHeading>
                <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center' }}
                  >
                    <info.icon />
                    <Typography variant="subtitle1">
                      {t(info.labelKey)}
                    </Typography>
                  </Stack>
                  {/* What the channel carries comes before who is on it. For
                      how many configured message types it is active: all by
                      email, the printed ones by letter — only for those who
                      may see the flows; the line stays, so the counts of the
                      three tiles keep one height. */}
                  <TileNote>
                    {coverageReady ?
                      t('deliveryChannel.overview.activeFor', {
                        count: sent.filter(info.coversMessage).length,
                      })
                    : ' '}
                  </TileNote>
                  <Typography
                    variant="h5"
                    sx={{ marginTop: 1 }}
                  >
                    {t('deliveryChannel.overview.people', {
                      count: count.userCount,
                    })}
                  </Typography>
                </CardContent>
                <TileLink>{t('deliveryChannel.overview.showPeople')}</TileLink>
              </CardActionArea>
            </Card>
          );
        })}

        <Card
          variant="outlined"
          sx={TILE}
        >
          <CardActionArea
            sx={ACTION_AREA}
            component={Link}
            to="/deliverychannel/suggestions"
          >
            <TileHeading>
              {t('deliveryChannel.overview.suggestionsHeading')}
            </TileHeading>
            <CardContent sx={{ flexGrow: 1, width: '100%' }}>
              {/* The same icons as the channel tiles, with the move between
                  them, on the row where those tiles name their channel. */}
              <Typography
                variant="subtitle1"
                component="div"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  // Icons alone are shorter than a line of text; take the
                  // line's height so the rows of the three tiles align.
                  minHeight: theme =>
                    `${theme.typography.subtitle1.lineHeight}em`,
                }}
              >
                {(counts.data?.deliveryChannelCounts ?? []).map(
                  (count, index) => {
                    const Icon = deliveryChannel(count.channel).icon;

                    return (
                      <Box
                        key={count.channel}
                        component="span"
                        sx={{ display: 'contents' }}
                      >
                        {index > 0 && <MdSwapHoriz />}
                        <Icon />
                      </Box>
                    );
                  }
                )}
              </Typography>
              {/* The same line the channel tiles spend on their coverage. */}
              <TileNote>
                {t('deliveryChannel.suggestions.recomputedDaily')}
              </TileNote>
              <Typography
                variant="h5"
                sx={{ marginTop: 1 }}
              >
                {t('deliveryChannel.overview.openSuggestions', { count: open })}
              </Typography>
            </CardContent>
            <TileLink>{t('deliveryChannel.overview.review')}</TileLink>
          </CardActionArea>
        </Card>
      </Box>

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
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {t(info.labelKey)}
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

      {/* Also once the size was changed, so it can be changed back. */}
      {(totalCount > limit || limit !== PAGE_SIZE) && (
        <Box sx={{ marginTop: 1.5 }}>
          <Pagination
            state={{
              page,
              limit,
              setPage,
              setLimit,
            }}
            totalCount={totalCount}
          />
        </Box>
      )}
    </div>
  );
}
