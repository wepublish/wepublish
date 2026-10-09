import styled from '@emotion/styled';
import {
  Button,
  Card as MuiCard,
  CardContent,
  Drawer,
  LinearProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit, MdOpenInNew } from 'react-icons/md';

import { PlaceholderInput } from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { DRAWER_WIDTHS } from '../drawer';
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

const Panel = styled(MuiCard)`
  display: grid;
  height: 200px;
  padding: 0;
  overflow: hidden;
  background-color: var(--rs-bg-well);
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
      <Panel>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <PlaceholderInput
            onAddClick={() => setIsDialogOpen(true)}
            addLabel={t('blocks.crowdfunding.title')}
          >
            {crowdfunding && (
              <Crowdfunding>
                <IconWrapper>
                  <Button
                    variant="outlined"
                    startIcon={<MdEdit />}
                    size="large"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    {t('blocks.crowdfunding.edit')}
                  </Button>
                </IconWrapper>

                <CrowdfundingRow>
                  <h3>
                    {t('blocks.crowdfunding.crowdfundingName', {
                      name: crowdfunding.name,
                    })}
                  </h3>
                </CrowdfundingRow>
                <CrowdfundingRow>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      crowdfunding.activeGoal?.progress || 0,
                      100
                    )}
                  />
                </CrowdfundingRow>
                <CrowdfundingRow>
                  <Button
                    variant="outlined"
                    href={`/crowdfundings/edit/${crowdfunding.id}`}
                    target="_blank"
                    endIcon={<MdOpenInNew />}
                  >
                    {crowdfunding.name} {t('blocks.crowdfunding.open')}
                  </Button>
                </CrowdfundingRow>
              </Crowdfunding>
            )}
          </PlaceholderInput>
        </CardContent>
      </Panel>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
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
