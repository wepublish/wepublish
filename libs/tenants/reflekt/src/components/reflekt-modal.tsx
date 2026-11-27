import styled from '@emotion/styled';
import { Modal } from '@wepublish/ui';

import theme from '../theme';

export const ReflektModal = styled(Modal)`
  .MuiButton-text.MuiButton-colorSecondary {
    color: ${theme.palette.text.primary};
  }
`;
