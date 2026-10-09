import { useLazyQuery } from '@apollo/client/react';
import { Button, IconButton } from '@mui/material';
import { FullPollFragment, PollsDocument } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircle } from 'react-icons/md';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PollStateIndication } from '../atoms/poll/pollStateIndication';
import { PollBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { humanizeError } from '../humanizeError';
import { DataTable } from '../listView/data-table';
import { Pagination } from '../listView/pagination';
import { enqueueSnackbar } from '../snackbar';

export function PollOpensAtView({ poll }: { poll: FullPollFragment }) {
  const now = new Date();
  const opensAt = new Date(poll.opensAt);
  const { t } = useTranslation();

  // poll is open
  if (now.getTime() > opensAt.getTime()) {
    return <>{t('pollList.openedAt', { openedAt: opensAt })}</>;
  }

  // poll is waiting to open
  return <>{t('pollList.pollWillOpenAt', { opensAt })}</>;
}

export function PollClosedAtView({ poll }: { poll: FullPollFragment }) {
  const now = new Date();
  const closedAt = poll.closedAt ? new Date(poll.closedAt) : undefined;
  const { t } = useTranslation();

  // poll has been closed
  if (closedAt && now.getTime() >= closedAt.getTime()) {
    return <>{t('pollList.hasBeenClosedAt', { closedAt })}</>;
  }

  return <>{t('pollList.closedAtNone')}</>;
}

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error && humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  }
};

export type SelectPollPanelProps = {
  selectedPoll: PollBlockValue['poll'] | null | undefined;
  onClose(): void;
  onSelect(poll: PollBlockValue['poll'] | null | undefined): void;
};

export function SelectPollPanel({
  selectedPoll,
  onClose,
  onSelect,
}: SelectPollPanelProps) {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const { t } = useTranslation();

  const [fetchPolls, { data, loading, error: pollsError }] =
    useLazyQuery(PollsDocument);

  useEffect(() => {
    if (pollsError) {
      onErrorToast(pollsError);
    }
  }, [pollsError]);

  useEffect(() => {
    fetchPolls({
      variables: {
        take: limit,
        skip: (page - 1) * limit,
      },
    });
  }, [page, limit, fetchPolls]);

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('blocks.poll.title')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="outlined"
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <DataTable
          data={data?.polls?.nodes ?? []}
          loading={loading}
          rowClassName={(rowData: any) =>
            rowData?.id === selectedPoll?.id ? 'highlighted-row' : ''
          }
          columns={[
            {
              id: 'state',
              label: t('pollList.state'),
              render: rowData => (
                <PollStateIndication
                  closedAt={rowData.closedAt}
                  opensAt={rowData.opensAt}
                />
              ),
            },
            {
              id: 'question',
              label: t('pollList.question'),
              width: 200,
              render: rowData => rowData.question || t('pollList.noQuestion'),
            },
            {
              id: 'opensat',
              label: t('pollList.opensAt'),
              width: 250,
              render: rowData => (
                <PollOpensAtView
                  poll={rowData as unknown as FullPollFragment}
                />
              ),
            },
            {
              id: 'closedat',
              label: t('pollList.closedAt'),
              width: 250,
              render: rowData => (
                <PollClosedAtView
                  poll={rowData as unknown as FullPollFragment}
                />
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rowData => (
                <IconButtonTooltip caption={t('blocks.poll.select')}>
                  <IconButton
                    aria-label={t('blocks.poll.select')}
                    size="small"
                    onClick={() => {
                      onSelect({ id: rowData.id, question: rowData.question });
                      onClose();
                    }}
                  >
                    <MdAddCircle />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
          }}
          totalCount={data?.polls?.totalCount ?? 0}
        />
      </DrawerBody>
    </>
  );
}
