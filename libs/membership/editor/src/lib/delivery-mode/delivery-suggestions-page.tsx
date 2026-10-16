import { useMutation, useQuery } from '@apollo/client/react';
import { Typography } from '@mui/material';
import {
  ConfirmAllDeliverySuggestionsDocument,
  ConfirmDeliverySuggestionDocument,
  DeliverySuggestionCountsDocument,
  DeliverySuggestionKind,
  DeliverySuggestionsDocument,
  RecomputeDeliverySuggestionsDocument,
} from '@wepublish/editor/api';
import {
  humanizeError,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  Message,
  Modal,
  Nav,
  Pagination,
  Table,
  toaster,
} from 'rsuite';

const PAGE_SIZE = 50;

const showError = (error: unknown) =>
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
    >
      {humanizeError(error as never)}
    </Message>
  );

/** `emailQuality:dead` → `emailQuality_dead`: a colon would be a namespace to i18next. */
const reasonKey = (reason: string) => reason.replace(':', '_');

/**
 * What the nightly step proposes: who should get letters instead of mails,
 * and who could go back. Nothing happens until an admin confirms, one by one
 * or all of a kind.
 */
export function DeliverySuggestionsPage() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<DeliverySuggestionKind>(
    DeliverySuggestionKind.ToLetter
  );
  const [page, setPage] = useState(1);
  const [askAll, setAskAll] = useState(false);

  const counts = useQuery(DeliverySuggestionCountsDocument);
  const list = useQuery(DeliverySuggestionsDocument, {
    variables: { kind, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE },
  });

  const refresh = () => {
    counts.refetch();
    list.refetch();
  };
  const mutationOptions = { onCompleted: refresh, onError: showError };

  const [confirmOne, { loading: confirmingOne }] = useMutation(
    ConfirmDeliverySuggestionDocument,
    mutationOptions
  );
  const [confirmAll, { loading: confirmingAll }] = useMutation(
    ConfirmAllDeliverySuggestionsDocument,
    {
      onError: showError,
      onCompleted: ({ confirmAllDeliverySuggestions: result }) => {
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={6000}
          >
            {t('deliveryMode.confirmedAll', result)}
          </Message>
        );
        refresh();
      },
    }
  );
  const [recompute, { loading: recomputing }] = useMutation(
    RecomputeDeliverySuggestionsDocument,
    {
      onError: showError,
      onCompleted: ({ recomputeDeliverySuggestions: result }) => {
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={6000}
          >
            {t('deliveryMode.recomputed', result)}
          </Message>
        );
        refresh();
      },
    }
  );

  const total = counts.data?.deliverySuggestionCounts;
  const shown =
    total?.[kind === DeliverySuggestionKind.ToLetter ? 'toLetter' : 'toMail'] ??
    0;
  const nodes = list.data?.deliverySuggestions.nodes ?? [];
  const totalCount = list.data?.deliverySuggestions.totalCount ?? 0;

  return (
    <ListViewContainer>
      <ListViewHeader>
        <h2>{t('deliveryMode.suggestionsTitle')}</h2>
        <Typography
          variant="body2"
          sx={{ color: 'var(--rs-text-secondary)' }}
        >
          {t('deliveryMode.suggestionsIntro')}
        </Typography>
      </ListViewHeader>

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Nav
          appearance="tabs"
          activeKey={kind}
          onSelect={key => {
            setKind(key as DeliverySuggestionKind);
            setPage(1);
          }}
        >
          <Nav.Item eventKey={DeliverySuggestionKind.ToLetter}>
            {t('deliveryMode.kind.toLetter', { count: total?.toLetter ?? 0 })}
          </Nav.Item>
          <Nav.Item eventKey={DeliverySuggestionKind.ToMail}>
            {t('deliveryMode.kind.toMail', { count: total?.toMail ?? 0 })}
          </Nav.Item>
        </Nav>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="sm"
            appearance="ghost"
            loading={recomputing}
            startIcon={<MdRefresh />}
            onClick={() => recompute()}
          >
            {t('deliveryMode.recompute')}
          </Button>
          <Button
            size="sm"
            appearance="primary"
            disabled={!shown}
            loading={confirmingAll}
            onClick={() => setAskAll(true)}
          >
            {t('deliveryMode.confirmAll', { count: shown })}
          </Button>
        </div>
      </div>

      <Table
        autoHeight
        data={nodes}
        loading={list.loading}
        style={{ marginTop: 16 }}
      >
        <Table.Column flexGrow={2}>
          <Table.HeaderCell>{t('deliveryMode.table.user')}</Table.HeaderCell>
          <Table.Cell>
            {(row: (typeof nodes)[number]) => (
              <Link to={`/users/edit/${row.user.id}`}>
                {[row.user.firstName, row.user.name].filter(Boolean).join(' ')}{' '}
                <span style={{ color: 'var(--rs-text-secondary)' }}>
                  {row.user.email}
                </span>
              </Link>
            )}
          </Table.Cell>
        </Table.Column>
        <Table.Column flexGrow={2}>
          <Table.HeaderCell>
            {t('deliveryMode.table.emailQuality')}
          </Table.HeaderCell>
          <Table.Cell>
            {(row: (typeof nodes)[number]) =>
              row.emailQuality ?
                `${t(`mailSend.emailSegments.${row.emailQuality.level}`)} · ${row.emailQuality.reason} · ${new Date(row.emailQuality.since).toLocaleDateString()}`
              : '–'
            }
          </Table.Cell>
        </Table.Column>
        <Table.Column flexGrow={2}>
          <Table.HeaderCell>{t('deliveryMode.table.reason')}</Table.HeaderCell>
          <Table.Cell>
            {(row: (typeof nodes)[number]) =>
              t(`deliveryMode.reason.${reasonKey(row.reason)}`)
            }
          </Table.Cell>
        </Table.Column>
        <Table.Column flexGrow={1}>
          <Table.HeaderCell>{t('deliveryMode.table.since')}</Table.HeaderCell>
          <Table.Cell>
            {(row: (typeof nodes)[number]) =>
              new Date(row.createdAt).toLocaleDateString()
            }
          </Table.Cell>
        </Table.Column>
        <Table.Column width={140}>
          <Table.HeaderCell> </Table.HeaderCell>
          <Table.Cell style={{ padding: 6 }}>
            {(row: (typeof nodes)[number]) => (
              <Button
                size="xs"
                appearance="primary"
                loading={confirmingOne}
                onClick={() => confirmOne({ variables: { id: row.id } })}
              >
                {t('deliveryMode.confirm')}
              </Button>
            )}
          </Table.Cell>
        </Table.Column>
      </Table>

      {totalCount > PAGE_SIZE && (
        <Pagination
          style={{ marginTop: 12 }}
          total={totalCount}
          limit={PAGE_SIZE}
          activePage={page}
          onChangePage={setPage}
        />
      )}

      <Modal
        open={askAll}
        onClose={() => setAskAll(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('deliveryMode.confirmAllTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t(`deliveryMode.confirmAllText.${kind}`, { count: shown })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="subtle"
            onClick={() => setAskAll(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            appearance="primary"
            onClick={() => {
              setAskAll(false);
              confirmAll({ variables: { kind } });
            }}
          >
            {t('deliveryMode.confirmAllYes')}
          </Button>
        </Modal.Footer>
      </Modal>
    </ListViewContainer>
  );
}
