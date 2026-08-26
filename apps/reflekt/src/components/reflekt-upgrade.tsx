import styled from '@emotion/styled';
import { Upgrade, UpgradeInformation } from '@wepublish/membership/website';
import { SubscribeContinuation } from '@wepublish/membership/website';
import { BuilderUpgradeProps } from '@wepublish/website/builder';

const ReflektUpgradeWrapper = styled('div')`
  ${UpgradeInformation} {
    background-color: ${({ theme }) => theme.palette.common.white};
    color: ${({ theme }) => theme.palette.common.black};

    .MuiTypography-root {
      color: inherit;
    }
  }

  ${SubscribeContinuation} {
    color: ${({ theme }) => theme.palette.common.black};
  }
`;

export const ReflektUpgrade = (props: BuilderUpgradeProps) => (
  <ReflektUpgradeWrapper>
    <Upgrade {...props} />
  </ReflektUpgradeWrapper>
);
