import {styled} from '@mui/material'
import {ArticleList} from '@wepublish/website'
import {ColTeaser} from '../website-builder-overwrites/blocks/col-teaser'
import {
  TeaserImgStyled,
  TeaserContentStyled,
  TeaserTitlesStyled,
  TeaserPreTitleStyled,
  AuthorsAndDate,
  ReadMoreButton,
  TeaserLeadStyled,
  TitleLine
} from '../website-builder-overwrites/blocks/teaser-overwrite.style'
import {BajourTeaserGrid} from '../website-builder-styled/blocks/teaser-grid-styled'

export const Headings = styled('div')`
  border-bottom: 1em solid #feddd2;
  margin-left: 3em;
  grid-column: 1/3;
  ${({theme}) => theme.breakpoints.up('lg')} {
    grid-column-start: 2;
    padding-bottom: 3em;
    margin-left: 1em;
  }
`

export const HeadingsInner = styled('div')`
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: flex;
    justify-content: space-between;
    max-width: 500px;
  }
`

export const Heading = styled('h1')`
  margin: 0;
  display: block;
  font-size: 1.6em;
  line-height: 1.2em;
  font-weight: 500;
`

export const Content = styled('section')`
  margin-left: 3em;
  margin-right: 2em;
  margin-top: 1em;
  grid-column: 1/3;
  ${({theme}) => theme.breakpoints.up('lg')} {
    margin-left: 1em;
    grid-column: 2/3;
  }
`

export const HeadingLarge = styled(Heading)`
  font-size: 2em;
  line-height: 1.3em;
  text-transform: uppercase;
`

export const BaslerinDesTagesWrapper = styled('article')`
  overflow-x: hidden;
`

export const MobileGrid = styled('div')`
  display: grid;
  grid-template-columns: 50% 50%;
  grid-auto-rows: max-content;
  gap: 1em;
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: none;
  }
`

export const DesktopGrid = styled('div')`
  display: none;
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: grid;
    grid-template-columns: 25% 75%;
    grid-auto-rows: max-content;
    gap: 1em;
    padding-left: 3em;
  }
`

export const DesktopImage = styled('div')`
  grid-row: 1/4;
  aspect-ratio: 1/1.2;
  border-radius: 5%;
  background-size: cover;
  background-position: center;
`

export const DateWeekdayContainer = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.8em;
  font-weight: 500;
  & svg {
    font-size: 1.5em;
  }
  ${({theme}) => theme.breakpoints.up('lg')} {
    font-size: 1.3em;
    align-items: flex-end;
  }
`

export const DateDisplay = styled('span')`
  display: block;
  border-bottom: 1px solid black;
  ${({theme}) => theme.breakpoints.up('lg')} {
    text-align: right;
  }
`

export const WeekdayDisplay = styled(DateDisplay)`
  border: none;
`

export const Title = styled('span')`
  font-size: 1.3em;
  font-weight: 700;
  margin-bottom: 1em;
`

export const ImageWrapperMobile = styled('div')`
  display: grid;
  grid-template-columns: 45vw 55vw;
  grid-template-rows: 1fr 1fr;
  gap: 0.8em;
  margin-top: 1em;
  margin-left: 1em;
  overflow-x: hidden;
  width: 100vw;
`

export const ArticleListDesktop = styled(ArticleList)`
  display: none;
  margin-top: 1em;
  margin-left: 1em;
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: block;
    overflow-x: hidden;
  }
  ${BajourTeaserGrid} {
    padding: 0;
    grid-template-columns: repeat(6, 10vw);
    height: 10vw;

    & > * {
      grid-column: span 1 !important;
    }
  }
  ${ColTeaser} {
    margin: 0;
    height: 10vw;

    ${TeaserImgStyled} {
      height: 10vw;
      border-radius: 15px;
    }
    ${TeaserContentStyled} {
      background: transparent;
      grid-column: 2/12;
      padding: 0;

      ${TeaserTitlesStyled} {
        color: white;
        text-shadow: 1px 1px 4px #000;
        font-size: 0.8rem;
        text-transform: uppercase;
      }

      ${TeaserPreTitleStyled}, ${AuthorsAndDate}, ${ReadMoreButton}, ${TeaserLeadStyled}, ${TitleLine} {
        display: none;
      }
    }
  }
`

export const ArticleListMobile = styled(ArticleListDesktop)`
  display: block;
  overflow-x: hidden;
  grid-template-columns: 1/7;
  margin: 0;
  ${BajourTeaserGrid} {
    grid-template-columns: repeat(6, 25vw);
    gap: 3vw;
    height: 25vw;

    ${ColTeaser} {
      margin: 0;
      height: 25vw;

      ${TeaserImgStyled} {
        height: 25vw;
        border-radius: 15px;
      }

      ${TeaserContentStyled} {
        background: transparent;
        grid-column: 2/23;

        ${TeaserTitlesStyled} {
          font-size: 0.7rem;
        }
      }
    }
  }
`
