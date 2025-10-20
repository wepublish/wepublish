import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  BreakBlockHeading,
  BreakBlockWrapper,
  EventBlockWrapper,
  ImageBlockCaption,
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
  RichTextBlockWrapper,
  SliderWrapper,
} from '@wepublish/block-content/website';
import {
  ContentWrapperStyled,
  useFullWidthContent,
} from '@wepublish/content/website';
import { ComponentProps } from 'react';

export const OnlineReportsContentWrapperStyled = styled(ContentWrapperStyled)<{
  fullWidth?: boolean;
}>`
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(4)};
  ${({ theme }) => theme.breakpoints.down('md')} {
    & > * {
      max-width: calc(100vw - ${({ theme }) => theme.spacing(5)});
    }
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    gap: ${({ theme }) => theme.spacing(7)};
  }

  ${({ theme, fullWidth }) =>
    !fullWidth &&
    css`
      row-gap: ${theme.spacing(3)};

      ${theme.breakpoints.up('md')} {
        row-gap: ${theme.spacing(4)};

        & > * {
          grid-column: 3/11;
        }

        ${RichTextBlockWrapper} {
        }

        &
          > :is(
            ${ImageBlockWrapper},
              ${SliderWrapper},
              ${EventBlockWrapper},
              ${BreakBlockWrapper}
          ) {
          grid-column: 2/12;
        }
      }

      ${BreakBlockHeading} {
        text-transform: none;
        font-family: ${theme.typography.subtitle2.fontFamily};
        font-style: ${theme.typography.subtitle2.fontStyle};
        font-weight: ${theme.typography.subtitle2.fontWeight};
      }

      ${ImageBlockInnerWrapper} {
        gap: ${theme.spacing(1)};
      }

      ${ImageBlockCaption} {
        color: #7c7c7c;
        font-size: 14px;
      }
    `}
`;

export const OnlineReportsContentWrapper = (
  props: ComponentProps<typeof OnlineReportsContentWrapperStyled>
) => {
  const fullWidth = useFullWidthContent();

  return (
    <OnlineReportsContentWrapperStyled
      fullWidth={fullWidth}
      {...props}
    />
  );
};
