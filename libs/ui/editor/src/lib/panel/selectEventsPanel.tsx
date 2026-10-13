import { useLazyQuery } from '@apollo/client/react';
import {
  EventListDocument,
  FullEventFragment,
  TagType,
} from '@wepublish/editor/api';
import { useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Drawer,
  Form,
  IconButton,
  Message,
  Pagination,
  Table as RTable,
  toaster,
  Toggle,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { InfoTooltip } from '../atoms/infoTooltip';
import { PermissionControl } from '../atoms/permissionControl';
import { SelectTags } from '../atoms/tag/selectTags';
import { EventBlockValue } from '../blocks/types';
import { DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES } from '../utility';
import { humanizeError } from '../humanizeError';
import { Table } from '../listView/list-view';

const onErrorToast = (error: Error) => {
  if (error?.message) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={8000}
      >
        {error && humanizeError(error)}
      </Message>
    );
  }
};

export type SelectEventPanelProps = {
  selectedFilter: EventBlockValue['filter'];
  onClose(): void;
  onSelect(
    filter: EventBlockValue['filter'],
    events: FullEventFragment[]
  ): void;
};

export function SelectEventPanel({
  selectedFilter,
  onClose,
  onSelect,
}: SelectEventPanelProps) {
  const [tagFilter, setTagFilter] = useState(selectedFilter.tags);
  const [eventFilter, setEventFilter] = useState(selectedFilter.events);
  const [allowCherryPicking, toggleCherryPicking] = useReducer(
    cherryPicking => !cherryPicking,
    !!eventFilter?.length
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const { t } = useTranslation();

  const [fetchEvents, { data, loading, error: eventListError }] =
    useLazyQuery(EventListDocument);

  useEffect(() => {
    if (eventListError) {
      onErrorToast(eventListError);
    }
  }, [eventListError]);

  const saveSelection = () => {
    if (allowCherryPicking) {
      onSelect(
        {
          events: eventFilter || [],
        },
        data?.events?.nodes.filter(({ id }) => eventFilter?.includes(id)) ?? []
      );
    } else {
      onSelect({ tags: tagFilter || [] }, data?.events?.nodes ?? []);
    }
  };

  useEffect(() => {
    fetchEvents({
      variables: {
        take: limit,
        skip: (page - 1) * limit,
        filter: {
          tags: tagFilter,
        },
      },
    });
  }, [page, limit, tagFilter]);

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.event.title')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'ghost'}
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>

          <Button
            appearance={'primary'}
            onClick={() => saveSelection()}
          >
            {t('saveAndClose')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body style={{ padding: '24px' }}>
        <div style={{ width: '250px' }}>
          <Form.Group controlId="tags">
            <Form.Label>{t('blocks.event.filterByTag')}</Form.Label>

            <SelectTags
              defaultTags={[]}
              name="tags"
              tagType={TagType.Event}
              setSelectedTags={setTagFilter}
              selectedTags={tagFilter}
            />
          </Form.Group>
        </div>

        {!allowCherryPicking && !!tagFilter?.length && (
          <Message
            showIcon
            type="info"
            style={{ marginTop: '12px' }}
          >
            {t('blocks.event.eventsFilterByTagInformation')}
          </Message>
        )}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '12px',
            marginTop: '48px',
          }}
        >
          <Toggle
            defaultChecked={allowCherryPicking}
            onChange={toggleCherryPicking}
            label={
              <>
                {t('blocks.event.cherryPick')}{' '}
                <InfoTooltip text={t('blocks.event.cherryPickInfo')} />
              </>
            }
          />
        </div>

        <Table
          minHeight={600}
          autoHeight
          loading={loading}
          data={data?.events?.nodes || []}
          rowClassName={rowData =>
            eventFilter?.includes(rowData?.id) ? 'highlighted-row' : ''
          }
        >
          {allowCherryPicking && (
            <RTable.Column width={36}>
              <RTable.HeaderCell>{''}</RTable.HeaderCell>
              <RTable.Cell style={{ padding: 0 }}>
                {(rowData: RowDataType<FullEventFragment>) => (
                  <div
                    style={{
                      height: '46px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Checkbox
                      defaultChecked={
                        eventFilter?.includes(rowData.id) ?? false
                      }
                      checked={eventFilter?.includes(rowData.id) ?? false}
                      value={eventFilter?.includes(rowData.id) ? 0 : 1}
                      onChange={shouldInclude =>
                        setEventFilter(old =>
                          shouldInclude ?
                            [...(old ?? []), rowData.id]
                          : old?.filter(id => id !== rowData.id)
                        )
                      }
                    />
                  </div>
                )}
              </RTable.Cell>
            </RTable.Column>
          )}

          <RTable.Column
            width={250}
            resizable
          >
            <RTable.HeaderCell>{t('event.list.name')}</RTable.HeaderCell>
            <RTable.Cell>
              {(rowData: RowDataType<FullEventFragment>) => rowData.name}
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            width={100}
            align="center"
            fixed="right"
          >
            <RTable.HeaderCell align="center">{t('action')}</RTable.HeaderCell>
            <RTable.Cell style={{ padding: '6px 0' }}>
              {(rowData: RowDataType<FullEventFragment>) => (
                <PermissionControl qualifyingPermissions={['CAN_UPDATE_EVENT']}>
                  <IconButtonTooltip caption={t('event.list.edit')}>
                    <Link
                      target="_blank"
                      to={`/events/edit/${rowData.id}`}
                    >
                      <IconButton
                        aria-label={t('event.list.edit')}
                        icon={<MdEdit />}
                        circle
                        size="sm"
                      />
                    </Link>
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </RTable.Cell>
          </RTable.Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager']}
          total={data?.events?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </Drawer.Body>
    </>
  );
}
