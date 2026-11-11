import styled from '@emotion/styled';
import {
  FocusedTeaserContent,
  FocusTeaser,
} from '@wepublish/block-content/website';

export const MannschaftFocusTeaser = styled(FocusTeaser)`
  ${FocusedTeaserContent} {
    color: ${({ theme }) => theme.palette.secondary.contrastText};
    background-color: ${({ theme }) => theme.palette.secondary.main};
  }
`;
