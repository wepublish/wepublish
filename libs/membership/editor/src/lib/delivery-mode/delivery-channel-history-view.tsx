import { useQuery } from '@apollo/client/react';
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  DeliveryModeBulkChangesDocument,
  MailChannel,
} from '@wepublish/editor/api';
import { Pagination } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { describeAudience } from '../mail-send/audience/audience-summary';
import { deliveryChannel, useDeliveryChannels } from './channels';
import { useAudienceLookups } from './use-audience-lookups';

const PAGE_SIZE = 20;

/**
 * The record of switches by audience: who moved which audience to which
 * channel, when, and how many it touched. The filter is read back as the
 * same phrases the wizard showed before the switch, so the list answers
 * «why is this person on letters» without opening anything.
 */
export function DeliveryChannelHistoryView() {
  const { t, i18n } = useTranslation();
  const channels = useDeliveryChannels();
  const lookups = useAudienceLookups();

  const [channel, setChannel] = useState<MailChannel | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, loading } = useQuery(DeliveryModeBulkChangesDocument, {
    variables: { skip: (page - 1) * limit, take: limit, channel },
    fetchPolicy: 'cache-and-network',
  });

  const changes = data?.deliveryModeBulkChanges.nodes ?? [];
  const totalCount = data?.deliveryModeBulkChanges.totalCount ?? 0;

  return (
    <div>
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h6">
          {t('deliveryMode.bulk.history.title')}
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={channel ?? 'all'}
          onChange={(_event, value) => {
            if (value !== null) {
              setChannel(value === 'all' ? undefined : (value as MailChannel));
              setPage(1);
            }
          }}
        >
          <ToggleButton value="all">
            {t('deliveryChannel.history.allChannels')}
          </ToggleButton>
          {channels.map(option => (
            <ToggleButton
              key={option.channel}
              value={option.channel}
            >
              {t(option.labelKey)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {!loading && !changes.length ?
        <Typography sx={{ color: 'text.secondary', marginTop: 2 }}>
          {t('deliveryMode.bulk.history.empty')}
        </Typography>
      : <TableContainer sx={{ marginTop: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('deliveryMode.bulk.history.when')}</TableCell>
                <TableCell>{t('deliveryMode.bulk.history.who')}</TableCell>
                <TableCell>{t('deliveryMode.bulk.history.channel')}</TableCell>
                <TableCell>{t('deliveryMode.bulk.history.filter')}</TableCell>
                <TableCell align="right">
                  {t('deliveryMode.bulk.history.people')}
                </TableCell>
                <TableCell align="right">
                  {t('deliveryMode.bulk.history.changed')}
                </TableCell>
                <TableCell align="right">
                  {t('deliveryMode.bulk.history.skipped')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changes.map(change => {
                const info = deliveryChannel(change.channel);

                return (
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
                      <Chip
                        size="small"
                        color={info.colour}
                        icon={<info.icon />}
                        label={t(info.labelKey)}
                      />
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
                            variant="outlined"
                            label={phrase}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{change.userCount}</TableCell>
                    <TableCell align="right">{change.changed}</TableCell>
                    <TableCell align="right">
                      {change.skippedWithoutAddress}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      }

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
