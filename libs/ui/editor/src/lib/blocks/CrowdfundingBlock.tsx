import styled from '@emotion/styled';
import { Button, Drawer, LinearProgress, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOpenInNew } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { BlockPreviewCard } from '../atoms/blockPreviewCard';
import { DRAWER_WIDTHS } from '../drawer';
import { SelectCrowdfundingPanel } from '../panel/selectCrowdfundingPanel';
import { CrowdfundingBlockValue } from '.';

const Progress = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: ${({ theme }) => theme.spacing(1.5)};
  align-items: center;
`;

export const CrowdfundingBlock = ({
  value: { crowdfunding },
  onChange,
  autofocus,
  disabled,
}: BlockProps<CrowdfundingBlockValue>) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => Boolean(autofocus) && !crowdfunding
  );
  const progress = Math.min(crowdfunding?.activeGoal?.progress ?? 0, 100);

  return (
    <>
      <BlockPreviewCard
        isEmpty={!crowdfunding}
        emptyLabel={t('blocks.crowdfunding.title')}
        editLabel={t('blocks.crowdfunding.edit')}
        onEdit={() => setIsDialogOpen(true)}
        title={crowdfunding?.name}
        disabled={disabled}
        actions={
          crowdfunding && (
            <Button
              size="small"
              href={`/crowdfundings/edit/${crowdfunding.id}`}
              target="_blank"
              endIcon={<MdOpenInNew />}
              sx={{ mr: 1 }}
            >
              {t('blocks.crowdfunding.open')}
            </Button>
          )
        }
      >
        {crowdfunding && (
          <Progress>
            <LinearProgress
              variant="determinate"
              value={progress}
            />
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {Math.round(crowdfunding.activeGoal?.progress ?? 0)}%
            </Typography>
          </Progress>
        )}
      </BlockPreviewCard>

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
