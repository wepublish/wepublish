import { ApolloError } from '@apollo/client';
import { TagType } from '@wepublish/editor/api';
import {
  FullEventFragment,
  getApiClientV2,
  useEventListLazyQuery,
} from '@wepublish/editor/api-v2';
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
  Table,
  toaster,
  Toggle,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PermissionControl } from '../atoms/permissionControl';
import { SelectTags } from '../atoms/tag/selectTags';
import { EventBlockValue } from '../blocks/types';
import { DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES } from '../utility';

const onErrorToast = (error: ApolloError) => {
  if (error?.message) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error?.message}
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
  const client = getApiClientV2();
  const [fetchEvents, { data, loading }] = useEventListLazyQuery({
    client,
    onError: onErrorToast,
    fetchPolicy: 'cache-and-network',
  });

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
            <Form.ControlLabel>
              {t('blocks.event.filterByTag')}
            </Form.ControlLabel>

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
          />
          {t('blocks.event.cherryPick')}
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
            <Table.Column width={36}>
              <Table.HeaderCell>{''}</Table.HeaderCell>
              <Table.Cell style={{ padding: 0 }}>
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
              </Table.Cell>
            </Table.Column>
          )}

          <Table.Column
            width={250}
            resizable
          >
            <Table.HeaderCell>{t('event.list.name')}</Table.HeaderCell>
            <Table.Cell>
              {(rowData: RowDataType<FullEventFragment>) => rowData.name}
            </Table.Cell>
          </Table.Column>

          <Table.Column
            width={150}
            align="center"
            fixed="right"
          >
            <Table.HeaderCell>{t('event.list.edit')}</Table.HeaderCell>
            <Table.Cell style={{ padding: '6px 0' }}>
              {(rowData: RowDataType<FullEventFragment>) => (
                <PermissionControl qualifyingPermissions={['CAN_UPDATE_EVENT']}>
                  <IconButtonTooltip caption={t('event.list.edit')}>
                    <Link
                      target="_blank"
                      to={`/events/edit/${rowData.id}`}
                    >
                      <IconButton
                        icon={<MdEdit />}
                        circle
                        size="sm"
                      />
                    </Link>
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </Table.Cell>
          </Table.Column>
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
