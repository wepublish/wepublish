import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  Crowdfunding,
  getApiClientV2,
  useCrowdfundingsQuery,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { MdAddCircle } from 'react-icons/md';
import { Button, Drawer, IconButton, Message, Table, toaster } from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip } from '../atoms';
import { CrowdfundingBlockValue } from '../blocks';

const DrawerBody = styled(Drawer.Body)`
  padding: 24px;
`;

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
  const client = getApiClientV2();

  const { data, loading } = useCrowdfundingsQuery({
    onError: onErrorToast,
    fetchPolicy: 'cache-and-network',
    client,
  });

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
          <Table.Column
            resizable
            width={200}
          >
            <Table.HeaderCell>{t('blocks.crowdfunding.name')}</Table.HeaderCell>
            <Table.Cell>
              {(rowData: RowDataType<Crowdfunding>) => rowData.name}
            </Table.Cell>
          </Table.Column>

          <Table.Column width={125}>
            <Table.HeaderCell align="center">
              {t('blocks.crowdfunding.select')}
            </Table.HeaderCell>
            <Table.Cell align="center">
              {(rowData: RowDataType<Crowdfunding>) => (
                <IconButtonTooltip caption={t('blocks.crowdfunding.select')}>
                  <IconButton
                    icon={<MdAddCircle />}
                    appearance="primary"
                    circle
                    size="xs"
                    onClick={() => {
                      onSelect(rowData as Crowdfunding);
                      onClose();
                    }}
                  />
                </IconButtonTooltip>
              )}
            </Table.Cell>
          </Table.Column>
        </Table>
      </DrawerBody>
    </>
  );
}
