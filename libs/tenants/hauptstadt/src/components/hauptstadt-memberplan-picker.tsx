import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { lighten } from '@mui/material';
import {
  MemberPlanItem,
  MemberPlanItemContent,
  MemberPlanItemDescription,
  MemberPlanPicker,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';
import { BuilderMemberPlanPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const HauptstadtMemberPlanItem = styled(MemberPlanItem)`
  --memberplan-item-picker-checked-bg: ${({ theme }) =>
    lighten(theme.palette.primary.main, 0.35)};

  .MuiRadio-root {
    display: none;
  }

  ${MemberPlanItemDescription} {
    font-size: 1rem;
  }

  ${MemberPlanItemDescription} * {
    font-size: inherit;
  }

  ${({ tags, theme }) => {
    return (
      tags?.includes('disabled-style') &&
      css`
        ${MemberPlanItemContent},
        ${MemberPlanItemDescription} {
          color: ${theme.palette.grey['500']};
        }

        ${MemberPlanItemDescription} {
          font-size: 0.75rem;
        }
      `
    );
  }}
`;

export const HauptstadtMemberPlanPicker = styled(
  forwardRef<HTMLButtonElement, BuilderMemberPlanPickerProps>(
    function HauptstadtMemberPlanPicker(props, ref) {
      return (
        <MemberPlanPicker
          {...props}
          alwaysShow
        />
      );
    }
  )
)`
  ${MemberPlanPickerRadios} {
    gap: ${({ theme }) => theme.spacing(4)};
  }
`;
