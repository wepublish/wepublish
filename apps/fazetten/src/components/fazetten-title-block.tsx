import styled from '@emotion/styled';
import { TitleBlock } from '@wepublish/block-content/website';
import { BuilderTitleBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isExtraSpacingTitleBlock } from './is-extra-spacing';

export const ExtraSpacingTitleBlock = styled(TitleBlock)`
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(3)};
  padding-bottom: ${({ theme }) => theme.spacing(3)};
`;

export const FazettenTitleBlock = cond([
  [
    isExtraSpacingTitleBlock,
    (props: BuilderTitleBlockProps) => <ExtraSpacingTitleBlock {...props} />,
  ],
  [T, props => <TitleBlock {...props} />],
]);
