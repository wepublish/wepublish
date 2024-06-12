import {css, styled} from '@mui/material'
import {
  TeaserImageWrapper,
  TeaserListBlockTeasers,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserWrapper
} from '@wepublish/website'

import {ListTeaser} from '../../website-builder-overwrites/blocks/list-teaser'

export const BabanewsTeaserList = styled(TeaserListBlockTeasers)`
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
          ${TeaserImageWrapper} {
            margin-right: 0;
            margin-left: auto;

            img {
              aspect-ratio: 16/9;
            }
          }

          &:nth-of-type(2n) {
            ${ListTeaser} {
              grid-template-areas:
                'pretitle image'
                'title image'
                'lead image'
                'authors image'
                '. image';
            }
            text-align: right;

            ${TeaserImageWrapper} {
              margin-left: 0;
              margin-right: auto;
            }

            ${TeaserPreTitleNoContent} {
              margin-left: 80%;
            }

            ${TeaserPreTitleWrapper} {
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
