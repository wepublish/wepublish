import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit, MdOpenInNew } from 'react-icons/md';
import { Button, Drawer, IconButton, Panel as RPanel, Progress } from 'rsuite';

import { PlaceholderInput } from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { SelectCrowdfundingPanel } from '../panel/selectCrowdfundingPanel';
import { CrowdfundingBlockValue } from '.';

const IconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`;

const Crowdfunding = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const CrowdfundingRow = styled.div`
  width: 100%;
  text-align: center;
`;

const Panel = styled(RPanel)`
  display: grid;
  height: 200px;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
`;

export const CrowdfundingBlock = ({
  value: { crowdfunding },
  onChange,
  autofocus,
}: BlockProps<CrowdfundingBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus && !crowdfunding) {
      setIsDialogOpen(true);
    }
  }, []);

  return (
    <>
      <Panel
        bodyFill
        bordered
      >
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {crowdfunding && (
            <Crowdfunding>
              <IconWrapper>
                <IconButton
                  size="lg"
                  icon={<MdEdit />}
                  onClick={() => setIsDialogOpen(true)}
                >
                  {t('blocks.crowdfunding.edit')}
                </IconButton>
              </IconWrapper>

              <CrowdfundingRow>
                <h3>
                  {t('blocks.crowdfunding.crowdfundingName', {
                    name: crowdfunding.name,
                  })}
                </h3>
              </CrowdfundingRow>
              <CrowdfundingRow>
                <Progress.Line
                  percent={crowdfunding.activeGoal?.progress || 0}
                />
              </CrowdfundingRow>
              <CrowdfundingRow>
                <Button
                  href={`/crowdfundings/edit/${crowdfunding.id}`}
                  target="_blank"
                  appearance="ghost"
                  endIcon={<MdOpenInNew />}
                >
                  {crowdfunding.name} {t('blocks.crowdfunding.open')}
                </Button>
              </CrowdfundingRow>
            </Crowdfunding>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer
        size="sm"
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <SelectCrowdfundingPanel
          selectedCrowdfunding={crowdfunding}
          onClose={() => setIsDialogOpen(false)}
          onSelect={onNewCrowdfunding => {
            setIsDialogOpen(false);
            onChange({ crowdfunding: onNewCrowdfunding });
          }}
        />
      </Drawer>
    </>
  );
};
