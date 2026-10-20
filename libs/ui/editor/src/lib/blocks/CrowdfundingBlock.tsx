import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  Drawer,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useState } from 'react';
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

const Panel = styled(Card)`
  display: grid;
  height: 200px;
  padding: 0;
  overflow: hidden;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

export const CrowdfundingBlock = ({
  value: { crowdfunding },
  onChange,
  autofocus,
}: BlockProps<CrowdfundingBlockValue>) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => Boolean(autofocus) && !crowdfunding
  );

  return (
    <>
      <Panel variant="outlined">
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
                  <Typography variant="h3">
                    {t('blocks.crowdfunding.crowdfundingName', {
                      name: crowdfunding.name,
                    })}
                  </Typography>
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
