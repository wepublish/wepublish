import { useQuery } from '@apollo/client/react';
import { Button, IconButton } from '@mui/material';
import { CrowdfundingsDocument } from '@wepublish/editor/api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircle } from 'react-icons/md';

import { IconButtonTooltip } from '../atoms';
import { CrowdfundingBlockValue } from '../blocks';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { humanizeError } from '../humanizeError';
import { DataTable } from '../listView/data-table';
import { enqueueSnackbar } from '../snackbar';

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error && humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  }
};

export type SelectCrowdfundingPanelProps = {
  selectedCrowdfunding:
    | CrowdfundingBlockValue['crowdfunding']
    | null
    | undefined;
  onClose(): void;
  onSelect(
    crowdfunding: CrowdfundingBlockValue['crowdfunding'] | null | undefined
  ): void;
};

export function SelectCrowdfundingPanel({
  selectedCrowdfunding,
  onClose,
  onSelect,
}: SelectCrowdfundingPanelProps) {
  const { t } = useTranslation();

  const {
    data,
    loading,
    error: crowdfundingsError,
  } = useQuery(CrowdfundingsDocument);

  useEffect(() => {
    if (crowdfundingsError) {
      onErrorToast(crowdfundingsError);
    }
  }, [crowdfundingsError]);

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('blocks.crowdfunding.title')}</DrawerTitle>

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
          data={data?.crowdfundings || []}
          loading={loading}
          rowClassName={(rowData: any) =>
            rowData?.id === selectedCrowdfunding?.id ? 'highlighted-row' : ''
          }
          columns={[
            {
              id: 'name',
              label: t('blocks.crowdfunding.name'),
              width: 200,
              render: rowData => rowData.name,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rowData => (
                <IconButtonTooltip caption={t('blocks.crowdfunding.select')}>
                  <IconButton
                    aria-label={t('blocks.crowdfunding.select')}
                    size="small"
                    onClick={() => {
                      onSelect(
                        rowData as CrowdfundingBlockValue['crowdfunding']
                      );
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
      </DrawerBody>
    </>
  );
}
