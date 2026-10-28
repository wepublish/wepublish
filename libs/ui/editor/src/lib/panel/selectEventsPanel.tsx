import { useQuery } from '@apollo/client/react';
import {
  Alert,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Switch,
} from '@mui/material';
import {
  EventListDocument,
  FullEventFragment,
  TagType,
} from '@wepublish/editor/api';
import { CanUpdateEvent } from '@wepublish/permissions';
import { useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { InfoTooltip } from '../atoms/infoTooltip';
import { PermissionControl } from '../atoms/permissionControl';
import { SelectTags } from '../atoms/tag/selectTags';
import { EventBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { DataTable } from '../listView/data-table';
import { Pagination } from '../listView/pagination';

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

  const { data, loading } = useQuery(EventListDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      filter: {
        tags: tagFilter,
      },
    },
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

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('blocks.event.title')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>

          <Button
            variant="contained"
            onClick={() => saveSelection()}
          >
            {t('saveAndClose')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody style={{ padding: '24px' }}>
        <div style={{ width: '250px' }}>
          <FormControl
            fullWidth
            sx={{ marginBottom: 3 }}
          >
            <FormLabel>{t('blocks.event.filterByTag')}</FormLabel>

            <SelectTags
              defaultTags={[]}
              name="tags"
              tagType={TagType.Event}
              setSelectedTags={setTagFilter}
              selectedTags={tagFilter}
            />
          </FormControl>
        </div>

        {!allowCherryPicking && !!tagFilter?.length && (
          <Alert
            severity="info"
            style={{ marginTop: '12px' }}
          >
            {t('blocks.event.eventsFilterByTagInformation')}
          </Alert>
        )}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '12px',
            marginTop: '48px',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                defaultChecked={allowCherryPicking}
                onChange={() => toggleCherryPicking()}
              />
            }
            label={
              <>
                {t('blocks.event.cherryPick')}{' '}
                <InfoTooltip text={t('blocks.event.cherryPickInfo')} />
              </>
            }
          />
        </div>

        <DataTable
          loading={loading}
          data={data?.events?.nodes || []}
          getRowId={row => row.id}
          rowClassName={row =>
            eventFilter?.includes(row.id) ? 'highlighted-row' : ''
          }
          columns={[
            ...(allowCherryPicking ?
              [
                {
                  id: 'select',
                  label: '',
                  width: 48,
                  render: (row: FullEventFragment) => (
                    <Checkbox
                      size="small"
                      checked={eventFilter?.includes(row.id) ?? false}
                      onChange={(_event, shouldInclude) =>
                        setEventFilter(old =>
                          shouldInclude ?
                            [...(old ?? []), row.id]
                          : old?.filter(id => id !== row.id)
                        )
                      }
                    />
                  ),
                },
              ]
            : []),
            {
              id: 'name',
              label: t('event.list.name'),
              width: 250,
              render: row => row.name,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: row => (
                <PermissionControl qualifyingPermissions={[CanUpdateEvent.id]}>
                  <IconButtonTooltip caption={t('event.list.edit')}>
                    <IconButton
                      component={RouterLink}
                      target="_blank"
                      to={`/events/edit/${row.id}`}
                      aria-label={t('event.list.edit')}
                      size="small"
                    >
                      <MdEdit />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
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
          totalCount={data?.events?.totalCount ?? 0}
        />
      </DrawerBody>
    </>
  );
}
