import { useQuery } from '@apollo/client/react';
import { Button } from '@mui/material';
import {
  FullGateFragment,
  GateMode,
  GatesDocument,
} from '@wepublish/editor/api';
import {
  DataTable,
  DataTableColumn,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { GateDeleteModal, GateDeleteTexts } from './gate-delete-modal';

export type GateColumn = DataTableColumn<FullGateFragment>;

type GateListProps = {
  mode: GateMode;
  /** Where the table keeps its column settings. */
  storageKey: string;
  title: string;
  description?: string;
  createLabel: string;
  columns: GateColumn[];
  deleteTexts: (gate: FullGateFragment) => GateDeleteTexts;
};

export function GateList({
  mode,
  storageKey,
  title,
  description,
  createLabel,
  columns,
  deleteTexts,
}: GateListProps) {
  const { t } = useTranslation();
  const [gateToDelete, setGateToDelete] = useState<FullGateFragment>();

  const { data, loading, refetch } = useQuery(GatesDocument, {
    variables: { mode },
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{title}</PageTitle>
          {description && <p>{description}</p>}
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="create"
            variant="contained"
            loading={loading}
            startIcon={<MdAdd />}
          >
            {createLabel}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey={storageKey}
          data={data?.gates ?? []}
          loading={loading}
          columns={[
            ...columns,
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: gate => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() => setGateToDelete(gate)}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />
      </TableWrapper>

      <GateDeleteModal
        gate={gateToDelete}
        texts={gateToDelete && deleteTexts(gateToDelete)}
        onDelete={refetch}
        onClose={() => setGateToDelete(undefined)}
      />
    </>
  );
}
