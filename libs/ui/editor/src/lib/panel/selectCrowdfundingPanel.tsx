import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  CrowdfundingsDocument,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircle } from 'react-icons/md';
import {
  Button,
  Drawer,
  IconButton,
  Message,
  Table as RTable,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip } from '../atoms';
import { CrowdfundingBlockValue } from '../blocks';
import { humanizeError } from '../humanizeError';
import { Table } from '../listView/list-view';

const DrawerBody = styled(Drawer.Body)`
  padding: 24px;
`;

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
      <Drawer.Header>
        <Drawer.Title>{t('blocks.crowdfunding.title')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'ghost'}
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <DrawerBody>
        <Table
          minHeight={600}
          autoHeight
          loading={loading}
          data={data?.crowdfundings || []}
          rowClassName={rowData =>
            rowData?.id === selectedCrowdfunding?.id ? 'highlighted-row' : ''
          }
        >
          <RTable.Column
            resizable
            width={200}
          >
            <RTable.HeaderCell>
              {t('blocks.crowdfunding.name')}
            </RTable.HeaderCell>
            <RTable.Cell>
              {(rowData: RowDataType<FullCrowdfundingFragment>) => rowData.name}
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            width={100}
            align="center"
            fixed="right"
          >
            <RTable.HeaderCell align="center">{t('action')}</RTable.HeaderCell>
            <RTable.Cell align="center">
              {(rowData: RowDataType<FullCrowdfundingFragment>) => (
                <IconButtonTooltip caption={t('blocks.crowdfunding.select')}>
                  <IconButton
                    aria-label={t('blocks.crowdfunding.select')}
                    icon={<MdAddCircle />}
                    circle
                    size="sm"
                    onClick={() => {
                      onSelect(
                        rowData as CrowdfundingBlockValue['crowdfunding']
                      );
                      onClose();
                    }}
                  />
                </IconButtonTooltip>
              )}
            </RTable.Cell>
          </RTable.Column>
        </Table>
      </DrawerBody>
    </>
  );
}
