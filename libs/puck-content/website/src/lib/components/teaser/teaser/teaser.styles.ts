import styled from '@emotion/styled';
import { Link } from '@wepublish/website/builder';

const interactiveElements =
  'a, button, input, select, textarea, label, summary, [role="button"], [tabindex]';

export const TeaserCardLink = styled(Link)`
  position: absolute;
  inset: 0;
  border-radius: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 2px;
  }
`;

export const TeaserCardWrapper = styled('article')`
  position: relative;
  isolation: isolate;

  :where(&) > :where(:not(${TeaserCardLink})) :where(${interactiveElements}) {
    position: relative;
    z-index: 1;
  }
`;
