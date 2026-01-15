import styled from '@emotion/styled';
import { Chip } from '@mui/material';
import {
  BaseTeaserPreTitle,
  TeaserPreTitleWrapper,
  TitleBlockPreTitle,
} from '@wepublish/block-content/website';
import { MemberPlan } from '@wepublish/website/api';
import { useContext } from 'react';

import { CurrentPaywallContext } from './hauptstadt-paywall';

const selectPremiumMemberplan = <T extends Pick<MemberPlan, 'tags'>>(
  memberplans: T[]
) => memberplans.find(mb => mb.tags?.includes('premium'));

const HauptstadtPremiumIndicator = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(3)};
  align-items: center;
`;

export const HauptstadtTitleBlockPreTitle: typeof TitleBlockPreTitle =
  props => {
    const paywall = useContext(CurrentPaywallContext);
    const premiumName = selectPremiumMemberplan(
      paywall?.memberPlans ?? []
    )?.name;
    const show = Boolean(premiumName || props.preTitle);

    if (!show) {
      return;
    }

    return (
      <HauptstadtPremiumIndicator
        css={theme => ({ marginBottom: -theme.spacing(2) })}
      >
        {props.preTitle && <TitleBlockPreTitle {...props} />}

        {premiumName && (
          <Chip
            color="primary"
            label={premiumName}
            sx={theme => ({
              ...theme.typography.blockTitlePreTitle,
              fontWeight: 400,
              padding: 0,
              margin: 0,
              height: 'initial',
            })}
          />
        )}
      </HauptstadtPremiumIndicator>
    );
  };

const HauptstadtTeaserPremiumIndicator = styled(HauptstadtPremiumIndicator)`
  grid-area: pretitle;
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  &:empty {
    margin-bottom: 0;
  }

  ${TeaserPreTitleWrapper} {
    margin-bottom: 0;
  }
`;

export const HauptstadtTeaserPreTitle: typeof BaseTeaserPreTitle = props => {
  const paywall = useContext(CurrentPaywallContext);
  const premiumName = selectPremiumMemberplan(paywall?.memberPlans ?? [])?.name;

  return (
    <HauptstadtTeaserPremiumIndicator>
      {props.preTitle && <BaseTeaserPreTitle {...props} />}

      {premiumName && (
        <Chip
          color="primary"
          label={premiumName}
          size="small"
          sx={theme => ({
            ...theme.typography.teaserPretitle,
            fontWeight: 400,
            padding: 0,
            height: 'initial',
          })}
        />
      )}
    </HauptstadtTeaserPremiumIndicator>
  );
};
