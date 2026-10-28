import styled from '@emotion/styled';
import { CrowdfundingBlock } from '@wepublish/block-content/website';
import { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';

const CrowdfundingWrapper = styled('div')``;

const GoalDescription = styled('p')`
  margin: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)}
    0;
  line-height: 1.1;
`;

export const MunotgloeggliCrowdfundingBlock = (
  props: BuilderCrowdfundingBlockProps
) => {
  const { crowdfunding } = props;
  const goalDescription = crowdfunding?.activeGoal?.description;

  const crowdfundingWithoutDescription =
    crowdfunding?.activeGoal ?
      {
        ...crowdfunding,
        activeGoal: { ...crowdfunding.activeGoal, description: null },
      }
    : crowdfunding;

  return (
    <CrowdfundingWrapper>
      <CrowdfundingBlock
        {...props}
        crowdfunding={crowdfundingWithoutDescription}
      />

      {goalDescription && <GoalDescription>{goalDescription}</GoalDescription>}
    </CrowdfundingWrapper>
  );
};
