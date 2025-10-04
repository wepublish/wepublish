import styled from '@emotion/styled';
import { RichTextBlock } from '@wepublish/block-content/website';

export const MannschaftRichtextBlock = styled(RichTextBlock)`
  & + & {
    margin-top: -${({ theme }) => theme.spacing(4)};
  }
`;
