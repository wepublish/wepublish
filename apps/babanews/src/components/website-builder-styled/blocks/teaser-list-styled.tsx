import {css, styled} from '@mui/material'
import {
  ImageWrapperStyled,
  TeaserContentStyled,
  TeaserListBlock,
  TeaserPreTitleNoContent,
  TeaserPreTitleStyled,
  TeaserWrapper
} from '@wepublish/website'

export const BabanewsTeaserList = styled(TeaserListBlock)`
  ${({theme}) =>
    css`
      grid-template-columns: repeat(12, 1fr);
      row-gap: ${theme.spacing(3)};
      column-gap: ${theme.spacing(4)};
      padding-left: calc(100% / 28);
      padding-right: calc(100% / 28);
      align-items: center;

      ${theme.breakpoints.up('sm')} {
        padding-left: calc(100% / 48);
        padding-right: calc(100% / 48);
        row-gap: ${theme.spacing(3)};
      }

      ${theme.breakpoints.up('md')} {
        row-gap: ${theme.spacing(6)};
        padding-left: calc(100% / 20);
        padding-right: calc(100% / 20);
        row-gap: ${theme.spacing(4)};

        ${TeaserWrapper} {
          ${ImageWrapperStyled} {
            grid-area: image;
            margin-right: 0;
            margin-left: auto;
          }

          ${TeaserContentStyled} {
            grid-area: content;
          }

          &:nth-of-type(2n + 1) {
            ${ImageWrapperStyled} {
              grid-area: content;
              margin-left: 0;
              margin-right: auto;
            }

            ${TeaserContentStyled} {
              grid-area: image;
              text-align: right;
            }

            ${TeaserPreTitleNoContent} {
              margin-left: 80%;
            }

            ${TeaserPreTitleStyled} {
              margin-left: auto;
            }
          }
        }
      }

      ${theme.breakpoints.up('xl')} {
        padding-left: calc(100% / 12);
        padding-right: calc(100% / 12);
        row-gap: ${theme.spacing(5)};
      }
    `}
`
